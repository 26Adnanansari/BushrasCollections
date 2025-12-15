import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Heart, ShoppingCart, ArrowLeft, Truck, Shield, RefreshCw, MessageCircle, Share2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
  image_url?: string | null;
  created_at: string;
  // Boutique fields
  fabric_type?: string;
  care_instructions?: string;
  available_sizes?: string[];
  available_colors?: string[];
  occasion_type?: string;
  embellishment?: string[];
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Variation State
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        // Try to fetch by slug first, then fallback to id (UUID)
        let query = supabase
          .from('products')
          .select('*');

        // Check if slug looks like a UUID (for backward compatibility)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        if (isUUID) {
          query = query.eq('id', slug);
        } else {
          query = query.eq('slug', slug);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Error fetching product:', error);
          return;
        }

        setProduct(data as any);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize("");
      setSelectedColor("");
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    // Validate Variations
    if (product.available_sizes && product.available_sizes.length > 0 && !selectedSize) {
      toast({
        title: "Select Size",
        description: "Please select a size to continue.",
        variant: "destructive"
      });
      return;
    }

    if (product.available_colors && product.available_colors.length > 0 && !selectedColor) {
      toast({
        title: "Select Color",
        description: "Please select a color to continue.",
        variant: "destructive"
      });
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImages[0] || '/placeholder.svg',
        category: product.category || 'Fashion',
        size: selectedSize,
        color: selectedColor
      });
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to your cart.`
    });
  };

  const handleBookOrder = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book an order.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    handleAddToCart();
    toast({
      title: "Order Booking",
      description: "Product added to cart. Proceed to checkout to complete your order.",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Bushra's Collection!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const productImages = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? ((product as any).images as string[])
    : ((product as any).image_url ? [((product as any).image_url as string)] : ['/placeholder.svg']);

  const isNew = new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  // Helper moved inside or outside, assuming it's used inside useEffect
  // Helper to update meta tag (moved inside effect in previous reads, keep it consistent)


  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images with Zoom */}
          <div className="space-y-4">
            <div
              className="aspect-[4/5] rounded-2xl overflow-hidden bg-card relative cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={productImages[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {isZoomed && productImages[selectedImage] && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${productImages[selectedImage]})`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    backgroundSize: '200%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              )}
              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                {selectedImage + 1} / {productImages.length}
              </div>
            </div>

            {/* Always show thumbnails for debugging/better UX */}
            <div className="grid grid-cols-4 gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                >
                  <img
                    src={image || '/placeholder.svg'}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              {isNew && (
                <Badge variant="secondary" className="mb-2">New Arrival</Badge>
              )}
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-4">{product.category}</p>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 md:h-5 md:w-5 fill-muted text-muted" />
                  ))}
                </div>
                <span className="text-xs md:text-sm text-muted-foreground">No reviews yet</span>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-4">
                PKR {product.price.toLocaleString()}
              </div>

              {product.description && (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Variations: Size & Color */}
            <div className="space-y-6">
              {product.available_sizes && product.available_sizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Select Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.available_sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3rem] h-10 px-4 rounded-md border text-sm font-medium transition-all
                          ${selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input hover:border-primary hover:text-primary'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.available_colors && product.available_colors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.available_colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`h-10 px-4 rounded-md border text-sm font-medium transition-all capitalize
                          ${selectedColor === color
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input hover:border-primary hover:text-primary'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center text-foreground font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(((product as any).stock ?? (product as any).stock_quantity ?? 0), quantity + 1))}
                    disabled={quantity >= ((product as any).stock ?? (product as any).stock_quantity ?? 0)}
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground ml-4">
                    {((product as any).stock ?? (product as any).stock_quantity ?? 0)} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  className="flex-1 min-w-[140px]"
                  size="lg"
                  onClick={handleBookOrder}
                  disabled={product.stock === 0}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Book Order
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 min-w-[140px]"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg" className="w-12 px-0">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="w-12 px-0" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {product.stock === 0 && (
                <p className="text-destructive text-sm">Out of stock</p>
              )}
            </div>

            <Separator />

            {/* Product Features */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Free Delivery</div>
                      <div className="text-xs text-muted-foreground">Orders over PKR 5,000</div>
                    </div>
                    <div>
                      <RefreshCw className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Easy Returns</div>
                      <div className="text-xs text-muted-foreground">7-day return policy</div>
                    </div>
                    <div>
                      <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Quality Guarantee</div>
                      <div className="text-xs text-muted-foreground">Authentic products</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Details Summary */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Product Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="text-foreground">{product.category}</span>
                </div>
                {product.fabric_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fabric:</span>
                    <span className="text-foreground">{product.fabric_type}</span>
                  </div>
                )}
                {product.care_instructions && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Care:</span>
                    <span className="text-foreground">{product.care_instructions}</span>
                  </div>
                )}
                {product.occasion_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occasion:</span>
                    <span className="text-foreground">{product.occasion_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Reviews Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-8">
              <Card>
                <CardContent className="p-8 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description || "This exquisite piece features premium quality fabric and exceptional craftsmanship."}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Category</span>
                        <p className="font-medium text-foreground">{product.category}</p>
                      </div>
                      {product.fabric_type && (
                        <div>
                          <span className="text-sm text-muted-foreground">Fabric</span>
                          <p className="font-medium text-foreground">{product.fabric_type}</p>
                        </div>
                      )}
                      {product.care_instructions && (
                        <div>
                          <span className="text-sm text-muted-foreground">Care Instructions</span>
                          <p className="font-medium text-foreground">{product.care_instructions}</p>
                        </div>
                      )}
                      {product.embellishment && (
                        <div>
                          <span className="text-sm text-muted-foreground">Embellishment</span>
                          <p className="font-medium text-foreground">
                            {Array.isArray(product.embellishment)
                              ? product.embellishment.join(', ')
                              : product.embellishment}
                          </p>
                        </div>
                      )}
                      {product.available_sizes && product.available_sizes.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Available Sizes</span>
                          <p className="font-medium text-foreground">{product.available_sizes.join(', ')}</p>
                        </div>
                      )}
                      {product.available_colors && product.available_colors.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Available Colors</span>
                          <p className="font-medium text-foreground">{product.available_colors.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-8">
              <Card>
                <CardContent className="p-8">
                  {/* Review Summary */}
                  <ReviewSummary productId={product.id} />

                  <Separator className="my-8" />

                  {/* Write Review Button */}
                  {user && (
                    <div className="mb-8">
                      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            Write a Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                            <DialogDescription>
                              Share your experience with {product.name}
                            </DialogDescription>
                          </DialogHeader>
                          <ReviewForm
                            productId={product.id}
                            productName={product.name}
                            onSuccess={() => {
                              setReviewDialogOpen(false);
                              // Refresh reviews list
                              window.location.reload();
                            }}
                            onCancel={() => setReviewDialogOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Reviews List */}
                  <ReviewsList productId={product.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default ProductDetail;