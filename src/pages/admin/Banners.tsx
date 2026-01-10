import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/admin/DraftIndicator";

const AdminBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    cta_text: "",
    cta_link: "",
    is_active: true,
    display_order: 0,
  });

  const { loadDraft, saveDraft, clearDraft, lastSaved } = useFormDraft({
    formId: editingBanner ? `banner_${editingBanner.id}` : 'banner_new',
    defaultValues: formData,
    enabled: dialogOpen,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (dialogOpen && !editingBanner) {
      const draft = loadDraft();
      if (draft) {
        setFormData(draft);
      }
    }
  }, [dialogOpen, editingBanner]);

  useEffect(() => {
    if (dialogOpen) {
      const timer = setTimeout(() => saveDraft(formData), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, dialogOpen]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBanner) {
        const { error } = await supabase
          .from('promotional_banners')
          .update(formData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast({ title: "Banner updated successfully" });
      } else {
        const { error } = await supabase
          .from('promotional_banners')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Banner created successfully" });
      }

      clearDraft();
      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Banner deleted successfully" });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || "",
      image_url: banner.image_url,
      cta_text: banner.cta_text || "",
      cta_link: banner.cta_link || "",
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      cta_text: "",
      cta_link: "",
      is_active: true,
      display_order: 0,
    });
    setEditingBanner(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-10 ">

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold px-3">Promotional Banners</h1>
            <p className="text-muted-foreground px-3 mb-4">Manage promotional banners displayed on the site</p>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md mx-3 mb-4 border border-blue-200">
              <p className="text-sm font-medium">Recommended Size: 1500x300px (5:1 Aspect Ratio) for best full-width display.</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="mr-3">
                <Plus className="h-4 w-4 mr-2 " />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit' : 'Add'} Banner</DialogTitle>
                <DialogDescription>
                  {editingBanner ? 'Update' : 'Create'} a promotional banner for your store
                </DialogDescription>
              </DialogHeader>
              <DraftIndicator lastSaved={lastSaved ? lastSaved.toISOString() : null} onClear={clearDraft} />
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Banner Image *</Label>
                  <SingleImageUpload
                    bucket="hero-media"
                    currentImageUrl={formData.image_url}
                    onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                    label="Banner Image"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cta_text">Button Text</Label>
                    <Input
                      id="cta_text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta_link">Button Link</Label>
                    <Input
                      id="cta_link"
                      value={formData.cta_link}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      placeholder="/products"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Internal path (e.g., /products) or full URL.
                    </p>
                    {formData.cta_link && formData.cta_link.includes(" ") && (
                      <p className="text-[10px] text-amber-600 mt-1 font-medium">
                        ⚠️ Note: Extra text detected. We will try to extract only the URL.
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBanner ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Banners</CardTitle>
            <CardDescription>Manage your promotional banners</CardDescription>
          </CardHeader>
          <CardContent>
            {banners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No banners yet. Create your first promotional banner.
              </div>
            ) : (
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{banner.title}</TableCell>
                        <TableCell>{banner.display_order}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(banner.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBanners;
