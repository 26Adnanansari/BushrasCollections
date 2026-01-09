import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ArrowLeft, Upload, Download, Info, ChevronDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { z } from "zod";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftIndicator } from "@/components/admin/DraftIndicator";
import { productSchema } from "@/schemas/productSchema";

interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string;
  price: number;
  list_price: number | null;
  category: string;
  brand: string;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  // NEW BOUTIQUE FIELDS
  fabric_type?: string | null;
  available_sizes?: string[] | null;
  available_colors?: string[] | null;
  care_instructions?: string | null;
  occasion_type?: string | null;
  embellishment?: string[] | null;
  created_at: string;
}

const CATEGORIES = [
  'Formal Dress',
  'Casual Dress',
  'Bridal Wear',
  'Party Wear',
  'Traditional Wear',
  'Accessories',
  'Footwear',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];
const FABRIC_TYPES = [
  'Cotton', 'Silk', 'Chiffon', 'Georgette', 'Velvet', 'Satin', 'Lawn', 'Karandi',
  'PURE RAW SILK', 'PURE SHAMOZ SILK', 'PURE ORGANZA', 'TASAR SILK',
  'PURE LAMA TISUE', 'PURE KHADI NET', 'NET', 'CHIFFON PURE', 'JAMAWAR PURE'
];
const OCCASIONS = ['Wedding', 'Party', 'Casual', 'Formal', 'Eid', 'Mehendi', 'Walima'];
const EMBELLISHMENTS = ['Embroidery', 'Sequins', 'Plain', 'Beadwork', 'Stone Work', 'Thread Work'];

const AdminProducts = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    list_price: '',
    category: '',
    brand: "Bushra's Collection",
    stock_quantity: '0',
    is_active: true,
    // NEW BOUTIQUE FIELDS
    fabric_type: '',
    available_sizes: [] as string[],
    available_colors: [] as string[],
    care_instructions: '',
    occasion_type: '',
    embellishment: [],
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customFabric, setCustomFabric] = useState("");

  const { loadDraft, saveDraft, clearDraft, lastSaved } = useFormDraft({
    formId: editingProduct ? `product_${editingProduct.id}` : 'product_new',
    defaultValues: { ...formData, productImages },
    enabled: isDialogOpen,
  });

  useEffect(() => {
    if (!user || !user.roles?.includes('admin')) {
      navigate('/');
      return;
    }

    fetchProducts();
  }, [user, navigate]);

  useEffect(() => {
    if (isDialogOpen && !editingProduct) {
      const draft = loadDraft();
      if (draft) {
        setFormData({
          sku: draft.sku || '',
          name: draft.name || '',
          description: draft.description || '',
          price: draft.price || '',
          list_price: draft.list_price || '',
          category: draft.category || '',
          brand: draft.brand || "Bushra's Collection",
          stock_quantity: draft.stock_quantity || '0',
          is_active: draft.is_active ?? true,
          fabric_type: draft.fabric_type || '',
          available_sizes: draft.available_sizes || [],
          available_colors: draft.available_colors || [],
          care_instructions: draft.care_instructions || '',
          occasion_type: draft.occasion_type || '',
          embellishment: draft.embellishment || [],
        });
        if (draft.productImages) {
          setProductImages(draft.productImages);
        }
      }
    }
  }, [isDialogOpen, editingProduct]);

  useEffect(() => {
    if (isDialogOpen) {
      const timer = setTimeout(() => {
        saveDraft({ ...formData, productImages });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, productImages, isDialogOpen]);

  // Handle CSV trigger
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error fetching products",
        description: error.message || "Failed to load product list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const productsToUpload = results.data
            .filter((row: any) => row.name && row.price) // Basic validation
            .map((row: any) => {
              // Handle multiple images from CSV (comma separated in image_url/images OR specific columns)
              let images: string[] = [];

              // 1. Check for explicit image columns (image1, image2, etc.)
              const explicitImages = [
                row.image1, row.image2, row.image3, row.image4, row.image5
              ].filter(url => url && typeof url === 'string' && url.trim().length > 0)
                .map(url => url.trim());

              if (explicitImages.length > 0) {
                images = explicitImages;
              }
              // 2. Fallback to comma-separated 'images' or 'image_url' column
              else if (row.images) {
                images = row.images.split(',').map((url: string) => url.trim());
              } else if (row.image_url) {
                images = row.image_url.split(',').map((url: string) => url.trim());
              }

              return {
                sku: row.sku || null,
                name: row.name,
                description: row.description,
                price: parseFloat(row.price),
                list_price: row.list_price ? parseFloat(row.list_price) : null,
                category: row.category,
                brand: row.brand || "Bushra's Collection",
                stock_quantity: parseInt(row.stock_quantity) || 0,
                is_active: row.is_active === 'TRUE' || row.is_active === 'true' || row.is_active === true,
                image_url: images[0] || null, // Primary image
                images: images, // All images array
                fabric_type: row.fabric_type,
                available_sizes: row.available_sizes ? row.available_sizes.split(',').map((s: string) => s.trim()) : [],
                available_colors: row.available_colors ? row.available_colors.split(',').map((c: string) => c.trim()) : [],
                care_instructions: row.care_instructions,
                occasion_type: row.occasion_type,
                embellishment: row.embellishment ? row.embellishment.split(',').map((e: string) => e.trim()) : []
              };
            });

          if (productsToUpload.length === 0) {
            throw new Error("No valid products found in CSV");
          }

          const { error } = await supabase
            .from('products')
            .insert(productsToUpload);

          if (error) throw error;

          toast({
            title: "Success",
            description: `Uploaded ${productsToUpload.length} products successfully`
          });
          fetchProducts();
          setIsDialogOpen(false);
        } catch (error: any) {
          console.error('Error uploading CSV:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to upload products from CSV",
            variant: "destructive"
          });
        } finally {
          setUploading(false);
          if (event.target) event.target.value = '';
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = productSchema.parse({
        sku: formData.sku || undefined,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        list_price: formData.list_price ? parseFloat(formData.list_price) : undefined,
        category: formData.category === '__custom__' ? customCategory : formData.category,
        brand: formData.brand,
        stock_quantity: parseInt(formData.stock_quantity),
        fabric_type: formData.fabric_type || undefined,
        available_sizes: formData.available_sizes.length > 0 ? formData.available_sizes : undefined,
        available_colors: formData.available_colors.length > 0 ? formData.available_colors : undefined,
        care_instructions: formData.care_instructions || undefined,
        occasion_type: formData.occasion_type || undefined,
        embellishment: formData.embellishment.length > 0 ? formData.embellishment : undefined,
      });

      if (productImages.length === 0) {
        toast({
          title: "Validation Error",
          description: "At least 1 product image is required",
          variant: "destructive"
        });
        return;
      }

      const productData = {
        ...validatedData,
        image_url: productImages[0], // Use first image as primary
        images: productImages, // Save all images
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product created successfully"
        });
      }

      clearDraft();
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '',
        list_price: '',
        category: '',
        brand: "Bushra's Collection",
        stock_quantity: '0',
        is_active: true,
        fabric_type: '',
        available_sizes: [],
        available_colors: [],
        care_instructions: '',
        occasion_type: '',
        embellishment: [],
      });
      setCustomCategory("");
      setProductImages([]);
      fetchProducts();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        console.error('Error saving product:', error);

        // Check for specific Supabase errors
        if ((error as any)?.code === '42703') { // Undefined column
          toast({
            title: "Database Schema Error",
            description: "The database is missing required columns. Please run the migration script.",
            variant: "destructive"
          });
        } else if ((error as any)?.code === '23505') { // Unique violation
          toast({
            title: "Duplicate Error",
            description: "A product with this SKU already exists.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: (error as any)?.message || "Failed to save product",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Load images from the new images array, fallback to image_url if empty
    const images = (product as any).images && (product as any).images.length > 0
      ? (product as any).images
      : (product.image_url ? [product.image_url] : []);

    setProductImages(images);

    setFormData({
      sku: product.sku || '',
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      list_price: product.list_price?.toString() || '',
      category: product.category,
      brand: product.brand,
      stock_quantity: product.stock_quantity?.toString() || '0',
      is_active: product.is_active ?? true,
      fabric_type: product.fabric_type || '',
      available_sizes: product.available_sizes || [],
      available_colors: product.available_colors || [],
      care_instructions: product.care_instructions || '',
      occasion_type: product.occasion_type || '',
      embellishment: product.embellishment || [],
    });
    setIsDialogOpen(true);
  };


  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active } as any)
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`
      });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      });
    }
  };



  const downloadSampleCsv = () => {
    // Updated headers to include separate image columns
    const headers = [
      'name', 'description', 'price', 'list_price', 'brand', 'category', 'stock_quantity',
      'image1', 'image2', 'image3', 'image4', 'image5', 'image_url',
      'is_active', 'sku', 'fabric_type', 'available_sizes', 'available_colors', 'occasion_type', 'care_instructions', 'embellishment'
    ];

    const sampleData = [
      [
        'Summer Dress', 'Beautiful floral summer dress', '2999', '3499', 'Fashion Brand', 'Formal Dress', '10',
        'https://example.com/front.jpg', 'https://example.com/back.jpg', '', '', '', '',
        'true', 'SKU-FO-12345', 'Cotton', 'S,M,L', 'Red,Blue', 'Party', 'Dry clean only', 'Embroidery'
      ],
      [
        'Casual Shirt', 'Comfortable cotton casual shirt', '1499', '1799', 'Style Co', 'Casual Dress', '15',
        'https://example.com/shirt.jpg', '', '', '', '', '',
        'true', '', 'Silk', 'M,L,XL', 'White,Black', 'Casual', 'Hand wash', 'Plain'
      ],
    ];

    const csv = [headers, ...sampleData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || !user.roles?.includes('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="mb-4 pl-0 hover:bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Product Management
              </h1>
              <p className="text-muted-foreground">
                Manage your product catalog
              </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={fetchProducts} disabled={loading} className="flex-1 md:flex-none">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      sku: '',
                      name: '',
                      description: '',
                      price: '',
                      list_price: '',
                      category: '',
                      brand: "Bushra's Collection",
                      stock_quantity: '0',
                      is_active: true,
                      fabric_type: '',
                      available_sizes: [],
                      available_colors: [],
                      care_instructions: '',
                      occasion_type: '',
                      embellishment: [],
                    });
                    setProductImages([]);
                  }} className="flex-1 md:flex-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'Update product details' : 'Add a new product to your catalog'}
                    </DialogDescription>
                  </DialogHeader>

                  <DraftIndicator lastSaved={lastSaved ? lastSaved.toISOString() : null} onClear={clearDraft} />

                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {/* 1. SKU CODE (Auto-generated) */}
                      <div className="md:col-span-2">
                        <Label htmlFor="sku">SKU Code (Auto-generated if empty)</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="Leave empty for auto-generation"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: SKU-{'{CATEGORY}'}-{'{5_DIGITS}'} (e.g., SKU-FO-10293)
                        </p>
                      </div>

                      {/* 2. PRODUCT NAME */}
                      <div className="md:col-span-2">
                        <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>

                      {/* 3. CATEGORY (Dropdown) */}
                      <div>
                        <Label htmlFor="category" className="text-sm font-medium mb-1.5 block">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                            <SelectItem value="__custom__">Custom Category...</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.category === '__custom__' && (
                          <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                            <Label htmlFor="custom-category" className="text-xs mb-1 block">New Category Name</Label>
                            <Input
                              id="custom-category"
                              placeholder="Enter custom category"
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                    </div>

                    {/* 4. BRAND */}
                    <div>
                      <Label htmlFor="brand" className="text-sm font-medium mb-1.5 block">Brand *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    {/* 5. PRICES */}
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium mb-1.5 block">Sale Price (PKR) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="list_price" className="text-sm font-medium mb-1.5 block">List Price (PKR) (Optional)</Label>
                      <Input
                        id="list_price"
                        type="number"
                        step="0.01"
                        value={formData.list_price}
                        onChange={(e) => setFormData({ ...formData, list_price: e.target.value })}
                        placeholder="Original price"
                        className="h-11"
                      />
                    </div>

                    {/* 6. STOCK */}
                    <div className="md:col-span-1">
                      <Label htmlFor="stock_quantity" className="text-sm font-medium mb-1.5 block">Stock Quantity *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium mb-3 block">Product Images *</Label>
                      <ImageUpload
                        images={productImages}
                        onChange={setProductImages}
                        maxImages={5}
                        maxSizeMB={1}
                      />
                    </div>

                    {/* 7. DESCRIPTION */}
                    <div className="md:col-span-2">
                      <Label htmlFor="description" className="text-sm font-medium mb-1.5 block">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="resize-none"
                        required
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({
                            ...formData,
                            description: `Elegant ${formData.name} perfect for special occasions`
                          })}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>

                    {/* 8. BOUTIQUE DETAILS (Collapsible) */}
                    <div className="md:col-span-2">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="outline" className="w-full h-11 justify-between px-4">
                            <span className="flex items-center">
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Additional Boutique Details (Optional)
                            </span>
                            <Badge variant="secondary" className="ml-2">Optional</Badge>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in slide-in-from-top-2">
                          {/* Fabric Type */}
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="fabric_type" className="text-sm font-medium mb-1.5 block">Fabric Type</Label>
                              <Select
                                value={formData.fabric_type || ''}
                                onValueChange={(value) => setFormData({ ...formData, fabric_type: value })}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select fabric" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                                  {FABRIC_TYPES.map((fabric) => (
                                    <SelectItem key={fabric} value={fabric}>{fabric}</SelectItem>
                                  ))}
                                  <SelectItem value="Custom">Custom / Add New...</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {formData.fabric_type === 'Custom' && (
                              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Type new fabric name..."
                                    value={customFabric}
                                    onChange={(e) => setCustomFabric(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (customFabric.trim()) {
                                          setFormData({ ...formData, fabric_type: customFabric.trim() });
                                          setCustomFabric("");
                                        }
                                      }
                                    }}
                                    className="h-11 flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                      if (customFabric.trim()) {
                                        setFormData({ ...formData, fabric_type: customFabric.trim() });
                                        setCustomFabric("");
                                      }
                                    }}
                                    className="h-11 px-4"
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Occasion Type */}
                          <div>
                            <Label htmlFor="occasion_type" className="text-sm font-medium mb-1.5 block">Occasion Type</Label>
                            <Select
                              value={formData.occasion_type}
                              onValueChange={(value) => setFormData({ ...formData, occasion_type: value })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select occasion" />
                              </SelectTrigger>
                              <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                                {OCCASIONS.map((occasion) => (
                                  <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Available Sizes */}
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium mb-3 block">Available Sizes</Label>
                            <div className="flex flex-wrap gap-x-4 gap-y-3 p-3 border rounded-lg bg-accent/30">
                              {SIZES.map((size) => (
                                <div key={size} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`size-${size}`}
                                    checked={formData.available_sizes.includes(size)}
                                    className="h-5 w-5"
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({
                                          ...formData,
                                          available_sizes: [...formData.available_sizes, size]
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          available_sizes: formData.available_sizes.filter(s => s !== size)
                                        });
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`size-${size}`} className="text-sm cursor-pointer select-none">{size}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Available Colors */}
                          <div className="md:col-span-2">
                            <Label htmlFor="available_colors" className="text-sm font-medium mb-1.5 block">Available Colors</Label>
                            <Input
                              id="available_colors"
                              placeholder="e.g., Red, Blue, Green (comma-separated)"
                              value={formData.available_colors.join(', ')}
                              className="h-11"
                              onChange={(e) => setFormData({
                                ...formData,
                                available_colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                              })}
                            />
                          </div>

                          {/* Occasion Type moved up */}

                          {/* Embellishment - Multi-select checkboxes */}
                          <div className="md:col-span-2 space-y-4">
                            <div>
                              <Label className="text-sm font-medium mb-3 block">Embellishment Selection</Label>
                              <div className="flex flex-wrap gap-x-4 gap-y-3 p-3 border rounded-lg bg-accent/30">
                                {EMBELLISHMENTS.map((emb) => (
                                  <div key={emb} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`emb-${emb}`}
                                      checked={formData.embellishment.includes(emb)}
                                      className="h-5 w-5"
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFormData({
                                            ...formData,
                                            embellishment: [...formData.embellishment, emb]
                                          });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            embellishment: formData.embellishment.filter(e => e !== emb)
                                          });
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`emb-${emb}`} className="text-sm cursor-pointer select-none">{emb}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Custom embellishment input */}
                            <div>
                              <Label className="text-sm font-medium mb-1.5 block">Add Custom Embellishment</Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter custom embellishment..."
                                  className="h-11"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const value = e.currentTarget.value.trim();
                                      if (value && !formData.embellishment.includes(value)) {
                                        setFormData({
                                          ...formData,
                                          embellishment: [...formData.embellishment, value]
                                        });
                                        e.currentTarget.value = '';
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    const value = input?.value.trim();
                                    if (value && !formData.embellishment.includes(value)) {
                                      setFormData({
                                        ...formData,
                                        embellishment: [...formData.embellishment, value]
                                      });
                                      if (input) input.value = '';
                                    }
                                  }}
                                  className="h-11 px-4"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Selected embellishments display */}
                            {formData.embellishment.length > 0 && (
                              <div className="pt-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Selected Embellishments:</Label>
                                <div className="flex flex-wrap gap-2">
                                  {formData.embellishment.map((emb) => (
                                    <Badge key={emb} variant="outline" className="pl-3 pr-1 py-1 gap-1 bg-background border-primary/20">
                                      <span className="text-sm">{emb}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            embellishment: formData.embellishment.filter(e => e !== emb)
                                          });
                                        }}
                                        className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors"
                                      >
                                        <Plus className="h-3 w-3 rotate-45" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Care Instructions */}
                          <div className="md:col-span-2">
                            <Label htmlFor="care_instructions" className="text-sm font-medium mb-1.5 block">Care Instructions</Label>
                            <Textarea
                              id="care_instructions"
                              value={formData.care_instructions}
                              onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
                              rows={3}
                              className="resize-none h-24"
                              placeholder="e.g., Dry clean only, Hand wash recommended"
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* 10. PUBLISH CHECKBOX */}
                      <div className="md:col-span-2 bg-accent/20 p-4 rounded-lg flex items-center space-x-3 border border-border/50">
                        <Checkbox
                          id="is_active"
                          checked={formData.is_active}
                          className="h-5 w-5"
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked as boolean })
                          }
                        />
                        <div className="space-y-0.5 pointer-events-none">
                          <Label
                            htmlFor="is_active"
                            className="text-sm font-semibold cursor-pointer pointer-events-auto"
                          >
                            Publish this product
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Uncheck to save as a draft (hidden from store)
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="mt-8 pt-6 border-t gap-3 sm:gap-2 flex-col sm:flex-row">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setIsDialogOpen(false)}
                        className="w-full sm:w-auto h-11 px-8 order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto h-11 px-10 order-1 sm:order-2"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage Products</CardTitle>
              <CardDescription>
                Add products manually or upload in bulk via CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">Product List</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-6">
                  {loading ? (
                    <div className="text-center py-8">Loading products...</div>
                  ) : (
                    <div className="relative w-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <img
                                  src={product.image_url || '/placeholder.svg'}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell>PKR {product.price}</TableCell>
                              <TableCell>{product.stock_quantity}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Badge
                                    variant={product.is_active ? "default" : "secondary"}
                                    className="cursor-pointer"
                                    onClick={() => toggleActive(product)}
                                  >
                                    {product.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(product)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(product.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bulk" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">CSV Upload Instructions</h4>
                          <p className="text-sm text-muted-foreground">
                            Upload a CSV file with product information. Download the sample template to see the required format.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            📄 For complete documentation, see <strong>BULK-UPLOAD-GUIDE.md</strong> in project root
                          </p>
                          <Button
                            variant="link"
                            className="px-0 h-auto mt-2"
                            onClick={() => setShowInstructions(!showInstructions)}
                          >
                            {showInstructions ? 'Hide' : 'Show'} detailed instructions
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadSampleCsv}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample CSV
                      </Button>
                    </div>

                    {showInstructions && (
                      <div className="p-4 border rounded-lg space-y-3 text-sm">
                        <h5 className="font-medium">CSV Format Requirements:</h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          CSV must include these columns (exact names):
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li><strong>name*</strong> (required, max 200 chars) - Product name</li>
                          <li><strong>description*</strong> (required, max 2000 chars) - Product description</li>
                          <li><strong>price*</strong> (required, number &gt; 0) - Sale price in PKR</li>
                          <li><strong>list_price</strong> (optional, number &gt; 0) - Original/List price in PKR</li>
                          <li><strong>brand*</strong> (required, max 100 chars) - Brand name</li>
                          <li><strong>category*</strong> (required, max 100 chars) - Product category</li>
                          <li><strong>stock_quantity*</strong> (required, integer ≥ 0) - Available quantity</li>
                          <li><strong>image_url*</strong> (required) - Single image URL</li>
                          <li><strong>is_active</strong> (optional, true/false) - Product visibility (defaults to true)</li>
                          <li><strong>sku</strong> (optional) - SKU Code</li>
                          <li><strong>fabric_type</strong> (optional) - Fabric Type</li>
                          <li><strong>available_sizes</strong> (optional) - Comma separated sizes (e.g. S,M,L)</li>
                          <li><strong>available_colors</strong> (optional) - Comma separated colors</li>
                          <li><strong>occasion_type</strong> (optional) - Occasion Type</li>
                          <li><strong>care_instructions</strong> (optional) - Care Instructions</li>
                          <li><strong>embellishment</strong> (optional) - Embellishment details</li>
                        </ul>
                        <p className="text-xs text-amber-600 mt-3">
                          ⚠️ Validation rules match manual form exactly. All required fields must be filled.
                        </p>
                      </div>
                    )}

                    <div className="hidden">
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleCsvUpload}
                        disabled={uploading}
                      />
                    </div>

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Processing CSV...' : 'Select & Upload CSV'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;