import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Eye } from "lucide-react";

interface Payment {
    id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    bank_name?: string;
    transaction_id?: string;
    transaction_proof_url?: string;
    payment_date: string;
    notes?: string;
}

interface PaymentHistoryProps {
    payments: Payment[];
    totalAmount: number;
    totalPaid: number;
    balanceDue: number;
}

const PaymentHistory = ({ payments, totalAmount, totalPaid, balanceDue }: PaymentHistoryProps) => {
    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'Cash';
            case 'bank_transfer': return 'Bank Transfer';
            case 'online': return 'Online Payment';
            default: return method;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment History
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Payment Summary */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-semibold">PKR {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-semibold text-green-600">PKR {totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">Balance Due:</span>
                        <span className={`font-bold text-lg ${balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            PKR {balanceDue.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Payment List */}
                {payments.length > 0 ? (
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Transactions</h4>
                        {payments.map((payment) => (
                            <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">PKR {payment.amount.toLocaleString()}</span>
                                            <Badge className={getStatusColor(payment.payment_status)}>
                                                {payment.payment_status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {getPaymentMethodLabel(payment.payment_method)}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(payment.payment_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                {payment.bank_name && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Bank: </span>
                                        <span>{payment.bank_name}</span>
                                    </div>
                                )}

                                {payment.transaction_id && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Transaction ID: </span>
                                        <span className="font-mono text-xs">{payment.transaction_id}</span>
                                    </div>
                                )}

                                {payment.transaction_proof_url && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(payment.transaction_proof_url, '_blank')}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View Proof
                                    </Button>
                                )}

                                {payment.notes && (
                                    <div className="text-sm bg-muted/30 p-2 rounded">
                                        <span className="text-muted-foreground">Note: </span>
                                        <span>{payment.notes}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No payments recorded yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PaymentHistory;
