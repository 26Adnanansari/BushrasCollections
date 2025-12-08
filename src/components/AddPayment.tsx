import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Upload, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft } from "@/hooks/useFormDraft";

interface AddPaymentProps {
    orderId: string;
    balanceDue: number;
    onPaymentAdded: () => void;
}

const AddPayment = ({ orderId, balanceDue, onPaymentAdded }: AddPaymentProps) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const initialFormState = {
        amount: '',
        payment_method: 'cash',
        bank_name: '',
        transaction_id: '',
        notes: ''
    };

    const { formData, setFormData, hasDraft, clearDraft, lastSaved } = useFormDraft({
        formId: `add_payment_${orderId}`,
        initialData: initialFormState
    });

    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofUrl, setProofUrl] = useState<string>('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file",
                description: "Please upload an image file",
                variant: "destructive"
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload an image smaller than 5MB",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${orderId}-${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('order-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('order-documents')
                .getPublicUrl(filePath);

            setProofFile(file);
            setProofUrl(publicUrl);

            toast({
                title: "Success",
                description: "Payment proof uploaded"
            });
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload failed",
                description: "Failed to upload payment proof",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);

        // Validation
        if (!amount || amount <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid payment amount",
                variant: "destructive"
            });
            return;
        }

        if (amount > balanceDue) {
            toast({
                title: "Amount exceeds balance",
                description: `Payment amount cannot exceed balance due (PKR ${balanceDue.toLocaleString()})`,
                variant: "destructive"
            });
            return;
        }

        if (formData.payment_method === 'bank_transfer' && !formData.bank_name) {
            toast({
                title: "Bank name required",
                description: "Please enter the bank name for bank transfers",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('order_payments')
                .insert([{
                    order_id: orderId,
                    amount: amount,
                    payment_method: formData.payment_method,
                    payment_status: 'completed',
                    bank_name: formData.payment_method === 'bank_transfer' ? formData.bank_name : null,
                    transaction_id: formData.transaction_id || null,
                    transaction_proof_url: proofUrl || null,
                    notes: formData.notes || null,
                    payment_date: new Date().toISOString()
                }]);

            if (error) throw error;

            toast({
                title: "Payment recorded",
                description: `PKR ${amount.toLocaleString()} payment added successfully`
            });

            // Reset form and clear draft
            clearDraft();
            setProofFile(null);
            setProofUrl('');
            setProofFile(null);
            setProofUrl('');

            // Notify parent to refresh
            onPaymentAdded();
        } catch (error) {
            console.error('Error recording payment:', error);
            toast({
                title: "Error",
                description: "Failed to record payment",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Record Payment
                    {hasDraft && (
                        <span className="ml-auto text-xs font-normal text-muted-foreground flex items-center gap-1">
                            <Save className="h-3 w-3" />
                            Draft saved {lastSaved && new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Amount */}
                    <div>
                        <Label htmlFor="amount">Amount (PKR) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={balanceDue}
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Balance due: PKR {balanceDue.toLocaleString()}
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <Label>Payment Method *</Label>
                        <RadioGroup
                            value={formData.payment_method}
                            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                            className="mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cash" id="cash" />
                                <Label htmlFor="cash" className="font-normal cursor-pointer">Cash</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                                <Label htmlFor="bank_transfer" className="font-normal cursor-pointer">Bank Transfer</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="online" id="online" />
                                <Label htmlFor="online" className="font-normal cursor-pointer">Online Payment</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="other" />
                                <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Bank Transfer Details */}
                    {formData.payment_method === 'bank_transfer' && (
                        <>
                            <div>
                                <Label htmlFor="bank_name">Bank Name *</Label>
                                <Input
                                    id="bank_name"
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    placeholder="e.g., HBL, Meezan Bank"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="transaction_id">Transaction ID</Label>
                                <Input
                                    id="transaction_id"
                                    value={formData.transaction_id}
                                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                                    placeholder="e.g., TXN123456789"
                                />
                            </div>

                            <div>
                                <Label htmlFor="proof">Upload Payment Proof</Label>
                                <div className="mt-1">
                                    <Input
                                        id="proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                    {isUploading && (
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Uploading...
                                        </p>
                                    )}
                                    {proofFile && !isUploading && (
                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                            <Upload className="h-3 w-3" />
                                            {proofFile.name} uploaded
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional notes about this payment..."
                            rows={3}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddPayment;
