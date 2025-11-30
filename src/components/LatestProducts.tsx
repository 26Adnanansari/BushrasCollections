import ProductCard from "./ProductCard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductGridSkeleton } from "./skeletons/ProductCardSkeleton";

const LatestProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, category, created_at')
          .order('created_at', { ascending: false })
          .limit(9);

        if (error) {
          console.error('Error fetching latest products:', error);
          return;
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Latest Arrivals
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our newest additions to the collection
            </p>
          </div>
          <ProductGridSkeleton count={9} />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Latest Arrivals
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our newest additions to the collection
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image_url || '/placeholder.svg'}
              category={product.category || 'Fashion'}
              isNew={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;
