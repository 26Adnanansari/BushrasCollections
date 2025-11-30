import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useFormDraft } from '@/hooks/useFormDraft';
import { DraftIndicator } from '@/components/admin/DraftIndicator';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'manual' | 'gateway' | 'offline';
  logo_url: string | null;
  is_active: boolean;
  config: any;
  instructions: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'manual' as 'manual' | 'gateway' | 'offline',
    instructions: '',
    is_active: true,
    display_order: 0,
  });

  const { loadDraft, saveDraft, clearDraft, draftState } = useFormDraft({
    formId: editingMethod ? `payment_${editingMethod.id}` : 'payment_new',
    defaultValues: formData,
    enabled: dialogOpen,
  });

  useEffect(() => {
    const roles = user?.roles || [];
    if (!roles.includes('admin') && !roles.includes('super_admin')) {
      navigate('/');
      return;
    }
    fetchPaymentMethods();
  }, [user, navigate]);

  useEffect(() => {
    if (dialogOpen && !editingMethod) {
      const draft = loadDraft();
      if (draft) {
        setFormData(draft);
      }
    }
  }, [dialogOpen, editingMethod]);

  useEffect(() => {
    if (dialogOpen) {
      const timer = setTimeout(() => saveDraft(formData), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, dialogOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (error: any) {
      toast.error('Failed to load payment methods');
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        instructions: method.instructions || '',
        is_active: method.is_active,
        display_order: method.display_order,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'manual',
        instructions: '',
        is_active: true,
        display_order: methods.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
    setFormData({
      name: '',
      type: 'manual',
      instructions: '',
      is_active: true,
      display_order: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(formData)
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('Payment method updated successfully');
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([formData]);

        if (error) throw error;
        toast.success('Payment method created successfully');
      }

      clearDraft();
      handleCloseDialog();
      fetchPaymentMethods();
    } catch (error: any) {
      toast.error('Failed to save payment method');
      console.error('Error saving payment method:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Payment method ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPaymentMethods();
    } catch (error: any) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error: any) {
      toast.error('Failed to delete payment method');
      console.error('Error deleting payment method:', error);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'manual':
        return 'default';
      case 'gateway':
        return 'secondary';
      case 'offline':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!user?.roles?.includes('admin') && !user?.roles?.includes('super_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage payment options available to customers at checkout
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment methods configured
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeColor(method.type)}>
                          {method.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={() => handleToggleActive(method.id, method.is_active)}
                        />
                      </TableCell>
                      <TableCell>{method.display_order}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {method.instructions || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(method)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(method.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
            <DialogDescription>
              Configure payment options for your customers
            </DialogDescription>
          </DialogHeader>
          <DraftIndicator lastSaved={draftState.lastSaved} onClear={clearDraft} />
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cash on Delivery"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (Contact-based)</SelectItem>
                    <SelectItem value="gateway">Gateway (Stripe, PayPal)</SelectItem>
                    <SelectItem value="offline">Offline (Bank Transfer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instructions for customers about this payment method"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  min={0}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMethod ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
