import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Link as LinkIcon, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export const ImageUpload = ({
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 2
}: ImageUploadProps) => {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeMB}MB limit`,
          variant: "destructive"
        });
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    onChange([...images, ...newImages]);
    setUploading(false);
    e.target.value = '';
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    if (images.length >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only add up to ${maxImages} images`,
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      onChange([...images, urlInput]);
      setUrlInput("");
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <Label className="text-sm font-semibold tracking-tight">Product Gallery ({images.length}/{maxImages}) *</Label>
        <span className="text-[10px] text-muted-foreground uppercase font-medium">Max {maxSizeMB}MB each</span>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border shadow-sm bg-accent/10">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1.5 right-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all h-8 w-8 rounded-full shadow-lg"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                  PRIMARY
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Controls */}
      {images.length < maxImages && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-xl bg-accent/5 border-dashed border-primary/20">
          {/* File Upload */}
          <div className="relative group overflow-hidden border bg-background rounded-lg hover:border-primary/50 transition-colors">
            <Label htmlFor="image-file-upload" className="flex items-center justify-center gap-2 p-3 cursor-pointer w-full h-full">
              {uploading ? <RefreshCw className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />}
              <span className="text-sm font-semibold text-primary">Upload Local</span>
            </Label>
            <Input
              id="image-file-upload"
              name="image-file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* URL Add */}
          <div className="flex items-center border bg-background rounded-lg hover:border-primary/50 transition-colors pl-3 overflow-hidden">
            <LinkIcon className="h-4 w-4 text-primary shrink-0 opacity-50" />
            <div className="flex-1 px-1">
              <Label htmlFor="image-url-input" className="sr-only">Paste image URL</Label>
              <Input
                id="image-url-input"
                name="image-url-input"
                placeholder="Paste image URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                className="h-10 pr-10 bg-transparent border-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="button"
              onClick={handleUrlAdd}
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary hover:bg-primary/10"
            >
              <X className="h-4 w-4 rotate-45" />
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">Uploading your images...</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic px-1">
        {images.length === 0 && "📸 At least 1 image is required to publish."}
        {images.length > 0 && `✅ ${images.length}/${maxImages} images added. Drag items or use Primary tag behavior.`}
      </p>
    </div>
  );
};