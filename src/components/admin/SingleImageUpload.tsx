import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SingleImageUploadProps {
  bucket: string;
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  maxSizeMB?: number;
  label?: string;
}

export const SingleImageUpload = ({ 
  bucket,
  currentImageUrl,
  onUploadComplete,
  maxSizeMB = 2,
  label = "Image"
}: SingleImageUploadProps) => {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File exceeds ${maxSizeMB}MB limit`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
      onUploadComplete(urlInput);
      setUrlInput("");
      toast({
        title: "Success",
        description: "Image URL added"
      });
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
    }
  };

  const removeImage = () => {
    onUploadComplete("");
  };

  return (
    <div className="space-y-4">
      <Label>{label} (max {maxSizeMB}MB)</Label>
      
      {/* Image Preview */}
      {currentImageUrl && (
        <div className="relative group w-full max-w-md aspect-video">
          <img 
            src={currentImageUrl} 
            alt="Preview"
            className="w-full h-full object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Controls */}
      {!currentImageUrl && (
        <div className="space-y-3">
          {/* File Upload */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1"
            />
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* URL Input */}
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="Or paste image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
            />
            <Button 
              type="button" 
              onClick={handleUrlAdd}
              variant="outline"
              size="icon"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <p className="text-sm text-primary">Uploading image...</p>
      )}
    </div>
  );
};
