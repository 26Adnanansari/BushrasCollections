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
        const { data: productsData, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, category, created_at, slug')
          .order('created_at', { ascending: false })
          .limit(9);

        if (error) {
          console.error('Error fetching latest products:', error);
          return;
        }

        if (productsData && productsData.length > 0) {
          const productIds = productsData.map(p => p.id);
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', productIds);

          const productsWithStats = productsData.map(product => {
            const productReviews = reviewsData?.filter(r => r.product_id === product.id) || [];
            const totalReviews = productReviews.length;
            const averageRating = totalReviews > 0
              ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
              : 0;

            return { ...product, averageRating, totalReviews };
          });

          setProducts(productsWithStats);
        } else {
          setProducts([]);
        }

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
    <section className="py-10 md:py-20 bg-background">
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image_url || '/placeholder.svg'}
              category={product.category || 'Fashion'}
              isNew={product.is_new}
              averageRating={product.averageRating}
              totalReviews={product.totalReviews}
              slug={product.slug}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;
