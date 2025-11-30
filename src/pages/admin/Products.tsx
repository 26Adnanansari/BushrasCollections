import { useState, useEffect } from "react";
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
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ArrowLeft, Upload, Download, Info } from "lucide-react";
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
  name: string;
  description: string;
  price: number;
  list_price: number;
  category: string;
  brand: string;
  stock_quantity: number;
  is_active: boolean;
  is_published: boolean;
  images: any;
  created_at: string;
}

const AdminProducts = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    list_price: '',
    category: '',
    brand: 'Bushra\'s Collection',
    stock_quantity: '0',
    is_published: true,
    initial_review_count: '0',
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const { loadDraft, saveDraft, clearDraft, draftState } = useFormDraft({
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
          name: draft.name || '',
          description: draft.description || '',
          price: draft.price || '',
          list_price: draft.list_price || '',
          category: draft.category || '',
          brand: draft.brand || 'Bushra\'s Collection',
          stock_quantity: draft.stock_quantity || '0',
          is_published: draft.is_published ?? true,
          initial_review_count: draft.initial_review_count || '0',
        });
        if (draft.productImages) {
          setProductImages(draft.productImages);
        }
      }
    }
  }, [isDialogOpen, editingProduct]);

  useEffect(() => {
    if (isDialogOpen) {
      const timer = setTimeout(() => saveDraft({ ...formData, productImages }), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, productImages, isDialogOpen]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = productSchema.parse({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        list_price: parseFloat(formData.list_price),
        category: formData.category,
        brand: formData.brand,
        stock_quantity: parseInt(formData.stock_quantity),
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
        images: productImages,
        is_published: formData.is_published,
        initial_review_count: parseInt(formData.initial_review_count) || 0
      };

      if (editingProduct) {
        // Update existing product
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
        // Create new product
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
        name: '',
        description: '',
        price: '',
        list_price: '',
        category: '',
        brand: 'Bushra\'s Collection',
        stock_quantity: '0',
        is_published: true,
        initial_review_count: '0',
      });
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
        toast({
          title: "Error",
          description: "Failed to save product",
          variant: "destructive"
        });
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      list_price: product.list_price?.toString() || '',
      category: product.category,
      brand: product.brand,
      stock_quantity: product.stock_quantity.toString(),
      is_published: product.is_published ?? true,
      initial_review_count: (product as any).initial_review_count?.toString() || '0',
    });
    setProductImages(Array.isArray(product.images) ? product.images : []);
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
    toast({
      title: "Feature Unavailable",
      description: "Product activation toggle is not available in the current database schema",
      variant: "default"
    });
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const Papa = await import('papaparse');
      
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const validProducts = [];
            const errors = [];

            for (let i = 0; i < results.data.length; i++) {
              const row: any = results.data[i];
              
              // Validate each row using same schema as manual form
              try {
                const validated = productSchema.parse({
                  name: row.name?.trim(),
                  description: row.description?.trim(),
                  price: parseFloat(row.price),
                  list_price: row.list_price && row.list_price.trim() !== '' ? parseFloat(row.list_price) : undefined,
                  brand: row.brand?.trim(),
                  category: row.category?.trim(),
                  stock_quantity: parseInt(row.stock_quantity || '0')
                });

                validProducts.push({
                  name: validated.name,
                  description: validated.description,
                  price: validated.price,
                  list_price: validated.list_price,
                  brand: validated.brand,
                  category: validated.category,
                  stock_quantity: validated.stock_quantity,
                  images: row.image_url ? [row.image_url.trim()] : [],
                  is_active: row.is_active?.toLowerCase() !== 'false',
                  is_published: row.is_active?.toLowerCase() !== 'false',
                  is_featured: false,
                  initial_review_count: 0
                });
              } catch (error: any) {
                errors.push(`Row ${i + 2}: ${error.errors?.[0]?.message || 'Invalid data'}`);
              }
            }

            if (errors.length > 0) {
              toast({
                title: "CSV Validation Errors",
                description: `${errors.slice(0, 3).join('. ')}${errors.length > 3 ? '...' : ''}`,
                variant: "destructive"
              });
              setUploading(false);
              return;
            }

            if (validProducts.length === 0) {
              toast({
                title: "Error",
                description: "No valid products found in CSV",
                variant: "destructive"
              });
              setUploading(false);
              return;
            }

            // Insert products directly via Supabase client
            const { error } = await supabase
              .from('products')
              .insert(validProducts);

            if (error) throw error;

            toast({
              title: "Success",
              description: `Successfully uploaded ${validProducts.length} products`
            });
            setCsvFile(null);
            fetchProducts();
          } catch (error: any) {
            console.error('CSV processing error:', error);
            toast({
              title: "Error",
              description: error.message || 'Failed to process CSV',
              variant: "destructive"
            });
          } finally {
            setUploading(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast({
            title: "Error",
            description: 'Failed to parse CSV file',
            variant: "destructive"
          });
          setUploading(false);
        }
      });
    } catch (error: any) {
      console.error('CSV upload error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to upload CSV',
        variant: "destructive"
      });
      setUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const headers = ['name', 'description', 'price', 'list_price', 'brand', 'category', 'stock_quantity', 'image_url', 'is_active'];
    const sampleData = [
      ['Summer Dress', 'Beautiful floral summer dress perfect for warm weather occasions', '2999', '3499', 'Fashion Brand', 'Women', '10', 'https://example.com/image.jpg', 'true'],
      ['Casual Shirt', 'Comfortable cotton casual shirt for everyday wear', '1499', '1799', 'Style Co', 'Men', '15', 'https://example.com/shirt.jpg', 'true'],
      ['Kids T-Shirt', 'Soft cotton t-shirt for children', '799', '', "Bushra's Collection", 'Kids', '20', 'https://example.com/kids-tshirt.jpg', 'true']
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="mb-4"
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

            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      list_price: '',
                      category: '',
                      brand: 'Bushra\'s Collection',
                      stock_quantity: '0',
                      is_published: true,
                      initial_review_count: '0',
                    });
                    setProductImages([]);
                  }}>
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

                  <DraftIndicator lastSaved={draftState.lastSaved} onClear={clearDraft} />

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="e.g., Dress, Jewelry, Accessories"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Sale Price (PKR) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="list_price">List Price (PKR) (Optional)</Label>
                          <Input
                            id="list_price"
                            type="number"
                            step="0.01"
                            value={formData.list_price}
                            onChange={(e) => setFormData({ ...formData, list_price: e.target.value })}
                            placeholder="Original price for discount display"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="brand">Brand *</Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="initial_review_count">Legacy Review Count</Label>
                        <Input
                          id="initial_review_count"
                          type="number"
                          min="0"
                          value={formData.initial_review_count || '0'}
                          onChange={(e) => setFormData({ ...formData, initial_review_count: e.target.value })}
                          placeholder="Reviews from past 20 years"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter existing review count from your legacy system
                        </p>
                      </div>

                      <ImageUpload
                        images={productImages}
                        onChange={setProductImages}
                        maxImages={5}
                        maxSizeMB={1}
                      />

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_published"
                          checked={formData.is_published}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, is_published: checked as boolean })
                          }
                        />
                        <Label 
                          htmlFor="is_published"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Publish this product (uncheck to save as draft)
                        </Label>
                      </div>
                    </div>

                    <DialogFooter className="mt-6">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
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
                                src={Array.isArray(product.images) && product.images[0] || '/placeholder.svg'} 
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
                                {!product.is_published && (
                                  <Badge variant="outline">Draft</Badge>
                                )}
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
                        </ul>
                        <p className="text-xs text-amber-600 mt-3">
                          ⚠️ Validation rules match manual form exactly. All required fields must be filled.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="csv-file">Select CSV File</Label>
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          disabled={uploading}
                        />
                      </div>

                      <Button
                        onClick={handleCsvUpload}
                        disabled={!csvFile || uploading}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload CSV'}
                      </Button>
                    </div>
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