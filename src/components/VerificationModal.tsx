import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    phone: string;
    onVerified: () => void;
    onSendCode?: () => Promise<void>;
    onVerifyCode?: (code: string) => Promise<void>;
}

export function VerificationModal({
    open,
    onOpenChange,
    phone,
    onVerified,
    onSendCode,
    onVerifyCode
}: VerificationModalProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setStep('send');
            setCode("");
        }
    }, [open]);

    const handleSendCode = async () => {
        setLoading(true);
        try {
            if (onSendCode) {
                await onSendCode();
            } else {
                // Default mock behavior
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setStep('verify');
            toast({
                title: "Code Sent",
                description: `Verification code sent to ${phone}`,
            });
        } catch (error: any) {
            toast({
                title: "Error sending code",
                description: error.message || "Failed to send verification code",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a valid 6-digit verification code",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            if (onVerifyCode) {
                await onVerifyCode(code);
            } else {
                // Default mock behavior
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setStep('success');
            setTimeout(() => {
                onVerified();
                onOpenChange(false);
            }, 1500);
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message || "Invalid code. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Verify Phone Number</DialogTitle>
                    <DialogDescription>
                        We need to verify your phone number to secure your account.
                    </DialogDescription>
                </DialogHeader>

                {step === 'send' && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <Phone className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Click below to send a verification code to <strong>{phone}</strong>
                        </p>
                        <Button onClick={handleSendCode} disabled={loading} className="w-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Send Verification Code
                        </Button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Enter Verification Code</Label>
                            <Input
                                id="code"
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                (For demo, enter any code)
                            </p>
                        </div>
                        <Button onClick={handleVerify} disabled={loading} className="w-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify Code"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setStep('send')}
                        >
                            Resend Code
                        </Button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8 text-green-600 animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-16 w-16 mb-4" />
                        <h3 className="text-lg font-bold">Verified!</h3>
                        <p className="text-sm text-muted-foreground">Redirecting...</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
