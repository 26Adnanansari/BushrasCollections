import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { useWishlistStore } from "@/store/wishlist";

const Wishlist = () => {
  const { items, isLoading, initialize, removeItem } = useWishlistStore();
  const [products, setProducts] = useState<any[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    initialize();
  }, [user]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (items.length === 0) {
        setProducts([]);
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', items);

      if (data) {
        setProducts(data);
      }
    };

    fetchProductDetails();
  }, [items]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="aspect-square bg-muted rounded-2xl mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">Start adding products you love!</p>
            <Button onClick={() => navigate('/products')}>
              <ShoppingBag className="h-5 w-5 mr-2" />
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : ['/placeholder.svg'])}
                category={product.category}
                isNew={product.created_at && new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                averageRating={0} // Fetching ratings for wishlist might be overkill for now, keeping simple
                totalReviews={0}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
};

export default Wishlist;
