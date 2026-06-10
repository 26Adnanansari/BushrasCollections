import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Heart, ShoppingCart, ArrowLeft, Truck, MessageCircle, Share2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { ShareModal } from "@/components/ShareModal";
import { PriceDisplay } from "@/components/PriceDisplay";
import { emitPixelEvent } from "@/utils/pixel";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";

const YouMayAlsoLike = lazy(() => import("@/components/YouMayAlsoLike"));
const ReviewSummary = lazy(() => import("@/components/reviews/ReviewSummary").then(m => ({ default: m.ReviewSummary })));
const ReviewsList = lazy(() => import("@/components/reviews/ReviewsList").then(m => ({ default: m.ReviewsList })));
const ReviewForm = lazy(() => import("@/components/reviews/ReviewForm").then(m => ({ default: m.ReviewForm })));

interface DressComponent {
  name: string;
  price: number | null;
}

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
  dress_components?: DressComponent[];
  delivery_weeks?: string | null;
  embellishment?: string[];
  is_custom?: boolean;
  advance_required?: number;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Variation State
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const searchParams = new URLSearchParams(location.search);
  const refId = searchParams.get('ref');

  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  const { whatsappNumber, globalSizeChartUrl } = useSiteSettings();

  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // React Query: fetch product with caching — 2nd visit is instant!
  const { data: productData, isLoading: loading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) return null;
      let query = supabase.from('products').select('*, reviews(rating)');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUUID) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });

  const product = productData as any;
  const ratings = product?.reviews?.map((r: any) => r.rating) || [];
  const averageRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
  const totalReviews = ratings.length;


  // Record view only once when product first loads
  const hasRecordedView = useRef(false);
  useEffect(() => {
    if (product && !hasRecordedView.current) {
      hasRecordedView.current = true;
      const refId = new URLSearchParams(location.search).get('ref');
      const recordView = async () => {
        const { error } = await supabase.rpc('record_site_interaction', {
          p_entity_type: 'product',
          p_entity_id: product.id,
          p_type: 'view',
          p_referrer_id: refId,
          p_platform: refId ? 'referral' : 'generic'
        });
        if (error) console.error('Error recording view:', error);
      };
      recordView();
    }
  }, [product]);

  // SEO: Dynamic Page Title, Meta Description, and OpenGraph tags
  useEffect(() => {
    if (!product) return;
    const siteName = "Bushra's Collection";
    const title = `${product.name} | ${siteName}`;
    const description = product.description
      ? product.description.substring(0, 155)
      : `Shop ${product.name} from ${siteName}. Premium quality ${product.category} in Pakistan.`;
    const image = product.images?.[0] || product.image_url || '';
    const url = window.location.href;

    document.title = title;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('description', description);
    setMeta('keywords', [product.name, product.category, product.fabric_type, ...(product.hidden_keywords || [])].filter(Boolean).join(', '));
    // OpenGraph
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:type', 'product', 'property');
    setMeta('og:site_name', siteName, 'property');
    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    return () => { document.title = siteName; };
  }, [product]);

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.available_sizes?.length === 1 ? product.available_sizes[0] : "");
      setSelectedColor(product.available_colors?.length === 1 ? product.available_colors[0] : "");
      setSelectedComponentIndex(0);
    }
  }, [product?.id]);

  const currentComponent = product?.dress_components?.[selectedComponentIndex];
  const currentPrice = currentComponent && currentComponent.price !== undefined ? currentComponent.price : product?.price;
  
  // If ANY component has no price, or if the product itself has no price, then it's a global WhatsApp Inquiry
  const hasUnpricedComponent = product?.dress_components?.some(c => c.price === null || c.price === undefined || c.price === 0);
  const isWhatsAppInquiry = hasUnpricedComponent || (!product?.dress_components?.length && (product?.price === null || product?.price === 0));

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
        name: currentComponent ? `${product.name} - ${currentComponent.name}` : product.name,
        price: currentPrice || 0,
        image: productImages[0] || '/placeholder.svg',
        category: product.category || 'Fashion',
        size: selectedSize,
        color: selectedColor,
        is_custom: product.is_custom,
        advance_required: product.advance_required
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

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleLike = async () => {
    if (!product) return;

    // Original wishlist logic (if any) could go here

    try {
      await supabase.rpc('record_site_interaction', {
        p_entity_type: 'product',
        p_entity_id: product.id,
        p_type: 'like'
      });
      emitPixelEvent('AddToWishlist', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [product.id],
        value: product.price,
        currency: 'PKR'
      });
      toast({ title: "Product Saved", description: "This has been added to your interests." });
    } catch (err) {
      console.error('Error liking product:', err);
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

      {/* Auto-SEO: Google Structured Data for Products */}
      <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": product.name,
                "image": productImages,
                "description": product.description || `Premium ${product.name} styling from Bushra's Collection.`,
                "sku": product.id,
                "brand": { "@type": "Brand", "name": "Bushra's Collection" },
                "category": product.category,
                "material": product.fabric_type,
                "keywords": [product.name, product.category, product.fabric_type, ...(product.hidden_keywords || [])].filter(Boolean).join(', '),
                "offers": {
                   "@type": "Offer",
                   "url": window.location.href,
                   "priceCurrency": "PKR",
                   "price": product.price,
                   "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                   "itemCondition": "https://schema.org/NewCondition",
                   "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                   "seller": {
                      "@type": "Organization",
                      "name": "Bushra's Collection"
                   }
                },
                "aggregateRating": totalReviews > 0 ? {
                   "@type": "AggregateRating",
                   "ratingValue": averageRating,
                   "reviewCount": totalReviews
                } : undefined
             })
          }}
      />

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
              className="aspect-[4/5] rounded-2xl overflow-hidden bg-card relative cursor-crosshair group select-none"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={productImages[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
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
              {/* Transparent overlay to block right-click save on mobile long-press */}
              <div
                className="absolute inset-0 z-10"
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              />
              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                {selectedImage + 1} / {productImages.length}
              </div>
            </div>

            {/* Thumbnails - also protected */}
            <div className="grid grid-cols-4 gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all relative select-none ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image || '/placeholder.svg'}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} />
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
              {product.delivery_weeks && (
                <Badge variant="outline" className="mb-2 ml-2 text-blue-600 border-blue-200 bg-blue-50">
                  <Truck className="w-3 h-3 mr-1" /> Delivery {product.delivery_weeks}
                </Badge>
              )}
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-4">{product.category}</p>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 md:h-5 md:w-5 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {totalReviews > 0 ? `${totalReviews} Review${totalReviews > 1 ? 's' : ''}` : "No reviews yet"}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              {isWhatsAppInquiry ? (
                <div className="text-2xl md:text-3xl font-bold text-primary mb-4">
                  Price on Request
                </div>
              ) : (
                <div className="text-2xl md:text-3xl font-bold text-primary mb-4">
                  <PriceDisplay amount={currentPrice || 0} />
                </div>
              )}


            </div>

            <Separator />

            {/* Variations: Size & Color */}
            <div className="space-y-6">
              {product.dress_components && product.dress_components.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Select Component
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.dress_components.map((comp, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedComponentIndex(idx)}
                        className={`min-w-[4rem] h-10 px-4 rounded-full border text-sm font-medium transition-all
                          ${selectedComponentIndex === idx
                            ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                            : 'border-input hover:border-primary hover:text-primary hover:bg-primary/5'
                          }`}
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.available_sizes && product.available_sizes.length > 1 && (
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-sm font-medium text-foreground block">
                      Select Size
                    </label>
                    {globalSizeChartUrl && (
                      <Dialog open={isSizeChartOpen} onOpenChange={setIsSizeChartOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary">Size Chart</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Size Chart</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 flex justify-center items-center overflow-hidden border rounded-md">
                            {globalSizeChartUrl.endsWith('.pdf') ? (
                              <iframe src={globalSizeChartUrl} className="w-full h-[60vh]" />
                            ) : (
                              <div
                                className="overflow-auto w-full max-h-[70vh] cursor-move select-none"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                              >
                                <img
                                  src={globalSizeChartUrl}
                                  alt="Size Chart"
                                  className="w-full h-auto object-contain"
                                  draggable="false"
                                  style={{ minWidth: '600px' }}
                                />
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
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

              {product.available_colors && product.available_colors.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.available_colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`h-10 px-4 rounded-md border text-sm font-medium transition-all capitalize flex items-center gap-2
                          ${selectedColor === color
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input hover:border-primary hover:bg-primary/5 text-foreground'
                          }`}
                      >
                        {color.startsWith('#') ? (
                           <>
                             <div className="w-4 h-4 rounded-full border border-border/50 shadow-inner" style={{ backgroundColor: color }} />
                             <span className="uppercase text-xs">{color}</span>
                           </>
                        ) : (
                          color
                        )}
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
                    size="icon"
                    className="h-10 w-10 border-primary/20 hover:border-primary hover:bg-primary/5"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <div className="w-16">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val === '') {
                          setQuantity(1 as any);
                          return;
                        }
                        const numVal = parseInt(val);
                        const maxLimit = product.is_custom ? 99 : Math.max(1, (product as any).stock ?? (product as any).stock_quantity ?? 0);
                        if (!isNaN(numVal)) {
                          setQuantity(Math.min(maxLimit, Math.max(1, numVal)));
                        }
                      }}
                      onBlur={() => {
                        if (!quantity || isNaN(quantity)) setQuantity(1);
                      }}
                      className="w-full h-10 text-center border rounded-md bg-background focus:ring-1 focus:ring-primary outline-none font-semibold text-lg"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-primary/20 hover:border-primary hover:bg-primary/5"
                    onClick={() => {
                      const maxLimit = product.is_custom ? 99 : Math.max(1, (product as any).stock ?? (product as any).stock_quantity ?? 0);
                      setQuantity(prev => Math.min(maxLimit, prev + 1));
                    }}
                    disabled={quantity >= (product.is_custom ? 99 : Math.max(1, (product as any).stock ?? (product as any).stock_quantity ?? 0))}
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground ml-4">
                    {product.is_custom ? 'Made to Order' : `${((product as any).stock ?? (product as any).stock_quantity ?? 0)} available`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                {isWhatsAppInquiry ? (
                  <Button
                    className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700"
                    size="lg"
                    onClick={() => {
                      const msg = encodeURIComponent(`Hello, I'm interested in the ${product.name}${currentComponent ? ` (${currentComponent.name})` : ''}. Please let me know the price and details.`);
                      window.open(`https://wa.me/${whatsappNumber || '923233228259'}?text=${msg}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp Inquiry
                  </Button>
                ) : (
                  <>
                    <Button
                      className="flex-1 min-w-[140px]"
                      size="lg"
                      onClick={handleBookOrder}
                      disabled={!product.is_custom && ((product as any).stock ?? (product as any).stock_quantity ?? 0) === 0}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Book Order
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 min-w-[140px]"
                      onClick={handleAddToCart}
                      disabled={!product.is_custom && ((product as any).stock ?? (product as any).stock_quantity ?? 0) === 0}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                  </>
                )}
                
                <Button variant="outline" size="lg" className="w-12 px-0" onClick={handleLike}>
                  <Heart className="h-5 w-5" />
                </Button>
                {!isWhatsAppInquiry && (
                  <Button variant="outline" size="lg" className="w-auto px-4 hover:text-green-600" onClick={() => {
                    const msg = encodeURIComponent(`Hello, I'm interested in the ${product?.name}. I'd like to ask a question.`);
                    window.open(`https://wa.me/${whatsappNumber || '923233228259'}?text=${msg}`, '_blank');
                  }}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp
                  </Button>
                )}
                <Button variant="outline" size="lg" className="w-12 px-0" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {!product.is_custom && ((product as any).stock ?? (product as any).stock_quantity ?? 0) === 0 && (
                <p className="text-destructive text-sm">Out of stock</p>
              )}
            </div>

            {/* Accordions for Description & Disclaimer */}
            <div className="mt-8">
              <Accordion type="single" collapsible defaultValue="description" className="w-full">
                {product.description && (
                  <AccordionItem value="description">
                    <AccordionTrigger className="text-base font-semibold">Description</AccordionTrigger>
                    <AccordionContent>
                      <div 
                        className="prose prose-sm max-w-none py-2 w-full overflow-x-auto
                          prose-headings:text-foreground prose-headings:font-semibold
                          prose-p:text-muted-foreground prose-p:leading-relaxed
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-li:text-muted-foreground
                          prose-a:text-foreground prose-a:no-underline
                          prose-table:w-full prose-table:border-collapse
                          [&_table]:!w-full [&_table]:min-w-[500px] md:[&_table]:min-w-full
                          prose-th:border prose-th:border-border prose-th:p-2 prose-th:text-left prose-th:bg-muted/50 prose-th:text-foreground prose-th:font-semibold
                          prose-td:border prose-td:border-border prose-td:p-2 prose-td:text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="disclaimer">
                  <AccordionTrigger className="text-base font-semibold">Disclaimer</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground leading-relaxed py-2 space-y-2">
                      <p>
                        We try our best to ensure that the colours viewed on the website are an exact representation of the actual colour of the outfit. However, there may be minor variations due to a number of factors such as, the nature of fabric dyes, weather at the time of dying and differences in display output due to lighting, digital photography, colour settings and capabilities of monitors.
                      </p>
                      <p>
                        Hand woven fabrics may have natural darker threads and marks in their weave. This is an inherent characteristic of the fabric and proof of its authenticity. This raw finish is the beauty of hand crafted products.
                      </p>
                      <p>
                        A variation in size of +/- 2 inches is considered within an acceptable tolerance.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Reviews Section - lazy loaded */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-8">Client Reviews</h2>
          <Card>
            <CardContent className="p-8">
              <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading reviews...</div>}>
                <ReviewSummary productId={product.id} />
              </Suspense>

              <Separator className="my-8" />

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
                      <Suspense fallback={<div className="py-4 text-center">Loading form...</div>}>
                        <ReviewForm
                          productId={product.id}
                          productName={product.name}
                          onSuccess={() => {
                            setReviewDialogOpen(false);
                            window.location.reload();
                          }}
                          onCancel={() => setReviewDialogOpen(false)}
                        />
                      </Suspense>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading reviews...</div>}>
                <ReviewsList productId={product.id} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
        
        {/* You May Also Like - lazy loaded */}
        <Suspense fallback={<div className="mt-24 mb-16 h-64 flex items-center justify-center text-muted-foreground">Loading recommendations...</div>}>
          <YouMayAlsoLike currentProduct={product} />
        </Suspense>
      </div>

      <Footer />
      {product && (
        <ShareModal
          isOpen={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          entityType="product"
          entityId={product.id}
          entityName={product.name}
          image={productImages[0]}
        />
      )}
    </main>
  );
};

export default ProductDetail;