import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Trash2, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/admin/DraftIndicator";

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  order_index: number;
  is_active: boolean;
}

interface NewSlideForm {
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  file: File | null;
}

const HeroSlider = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [newSlides, setNewSlides] = useState<NewSlideForm[]>([
    { title: "", subtitle: "", cta_text: "", cta_link: "", file: null }
  ]);

  const draftData = newSlides.map(({ file, ...rest }) => rest);
  const { loadDraft, saveDraft, clearDraft, lastSaved } = useFormDraft({
    formId: 'hero_slides',
    defaultValues: draftData,
    enabled: true,
  });

  useEffect(() => {
    checkAdminAndFetch();
    const draft = loadDraft();
    if (draft && Array.isArray(draft)) {
      setNewSlides(draft.map((d: any) => ({ ...d, file: null })));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(draftData), 2000);
    return () => clearTimeout(timer);
  }, [newSlides]);

  const checkAdminAndFetch = async () => {
    if (!user) {
      toast({
        title: "Access denied",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error checking permissions",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const isAdmin = roleData?.some(r => r.role === 'admin');

    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    fetchSlides();
  };

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setSlides(data || []);
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

  const addNewSlideForm = () => {
    setNewSlides([...newSlides, { title: "", subtitle: "", cta_text: "", cta_link: "", file: null }]);
  };

  const removeSlideForm = (index: number) => {
    if (newSlides.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one slide form must remain",
        variant: "destructive",
      });
      return;
    }
    setNewSlides(newSlides.filter((_, i) => i !== index));
  };

  const updateSlideForm = (index: number, field: keyof NewSlideForm, value: string | File | null) => {
    const updated = [...newSlides];
    updated[index] = { ...updated[index], [field]: value };
    setNewSlides(updated);
  };

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");

    if (!isImage) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB for images
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Max size: 2MB for images",
        variant: "destructive",
      });
      return;
    }

    updateSlideForm(index, 'file', file);
  };

  const handleSubmitAllSlides = async () => {
    // Validate all forms have files
    const invalidForms = newSlides.filter(slide => !slide.file);
    if (invalidForms.length > 0) {
      toast({
        title: "Missing files",
        description: "Please add an image or video to all slides",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < newSlides.length; i++) {
        const slide = newSlides[i];
        if (!slide.file) continue;

        const fileExt = slide.file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from("hero-media")
          .upload(filePath, slide.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("hero-media")
          .getPublicUrl(filePath);

        // Insert into database
        const { error: insertError } = await supabase
          .from("hero_slides")
          .insert({
            image_url: publicUrl,
            title: slide.title || null,
            subtitle: slide.subtitle || null,
            cta_text: slide.cta_text || null,
            cta_link: slide.cta_link || null,
            order_index: slides.length + i,
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: `${newSlides.length} slide(s) uploaded successfully`,
      });

      clearDraft();
      setNewSlides([{ title: "", subtitle: "", cta_text: "", cta_link: "", file: null }]);
      fetchSlides();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleSlideActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("hero_slides")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Slide status updated",
      });

      fetchSlides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSlide = async (id: string, mediaUrl: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      // Extract filename from URL
      const fileName = mediaUrl.split("/").pop();

      // Delete from storage
      if (fileName) {
        await supabase.storage.from("hero-media").remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from("hero_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });

      fetchSlides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-serif font-bold mb-8">Hero Slider Management</h1>

        {/* Upload Section */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New Slides</h2>
            <DraftIndicator lastSaved={lastSaved} onClear={clearDraft} />
          </div>

          <div className="space-y-6">
            {newSlides.map((slide, index) => (
              <div key={index} className="p-4 border border-border rounded-lg relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Slide {index + 1}</h3>
                  {newSlides.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlideForm(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={slide.title}
                      onChange={(e) => updateSlideForm(index, 'title', e.target.value)}
                      placeholder="Elegant Fashion"
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => updateSlideForm(index, 'subtitle', e.target.value)}
                      placeholder="Discover timeless elegance..."
                    />
                  </div>
                  <div>
                    <Label>CTA Button Text</Label>
                    <Input
                      value={slide.cta_text}
                      onChange={(e) => updateSlideForm(index, 'cta_text', e.target.value)}
                      placeholder="Shop Collection"
                    />
                  </div>
                  <div>
                    <Label>CTA Link</Label>
                    <Input
                      value={slide.cta_link}
                      onChange={(e) => updateSlideForm(index, 'cta_link', e.target.value)}
                      placeholder="/products"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(index, e)}
                    disabled={uploading}
                    className="hidden"
                    id={`hero-upload-${index}`}
                  />
                  <Label htmlFor={`hero-upload-${index}`} className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">
                      {slide.file ? slide.file.name : "Click to upload media"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Images: WebP/JPG (max 2MB, 1920x1080px recommended)
                    </p>
                  </Label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={addNewSlideForm}
              disabled={uploading}
              className="flex-1"
            >
              Add Another Slide
            </Button>
            <Button
              onClick={handleSubmitAllSlides}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Uploading..." : `Upload ${newSlides.length} Slide(s)`}
            </Button>
          </div>
        </Card>

        {/* Slides List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Existing Slides ({slides.length})</h2>

          {slides.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No slides yet. Add your first slide above!
            </Card>
          ) : (
            slides.map((slide) => (
              <Card key={slide.id} className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />

                  <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img src={slide.image_url} alt={slide.title || ''} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">{slide.title || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground">{slide.subtitle || "No subtitle"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Order: {slide.order_index}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${slide.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`active-${slide.id}`}
                        checked={slide.is_active}
                        onCheckedChange={() => toggleSlideActive(slide.id, slide.is_active)}
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteSlide(slide.id, slide.image_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;