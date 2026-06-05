import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Skeleton } from "@/components/ui/skeleton";

interface YouMayAlsoLikeProps {
  currentProduct: any;
}

/**
 * Smart Recommendation Algorithm:
 *
 * FOR LOGGED-IN USER:
 *   1. Fetch user's wishlist → extract their preferred categories
 *   2. Show products from those preferred categories (most-liked category first)
 *   3. Fill remaining slots from same category as current product
 *   4. Fill any remaining slots with newest products store-wide
 *
 * FOR GUEST:
 *   1. Same category as current product
 *   2. Fill with newest products
 *
 * Always excludes: current product, already wishlisted products
 */
const fetchRecommendations = async (
  productId: string,
  category: string,
  userId?: string
) => {
  const TARGET = 4;
  const result: any[] = [];
  const excludeIds = new Set([productId]);

  // ── Step 1: For logged-in user, find preferred categories from wishlist ──
  if (userId) {
    const { data: wishlistItems } = await supabase
      .from("wishlist")
      .select("product_id, products(category)")
      .eq("user_id", userId);

    if (wishlistItems && wishlistItems.length > 0) {
      // Add wishlisted products to exclude list (user already knows them)
      wishlistItems.forEach((w: any) => excludeIds.add(w.product_id));

      // Count category frequency from wishlist
      const categoryCount: Record<string, number> = {};
      wishlistItems.forEach((w: any) => {
        const cat = (w.products as any)?.category;
        if (cat && cat !== category) {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
      });

      // Sort categories by interest (most liked first)
      const preferredCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .map(([cat]) => cat)
        .slice(0, 3); // Top 3 preferred categories

      // Fetch from preferred categories
      if (preferredCategories.length > 0 && result.length < TARGET) {
        const remaining = TARGET - result.length;
        const { data: preferred } = await supabase
          .from("products")
          .select("id, name, slug, price, image_url, category, is_custom, dress_components")
          .in("category", preferredCategories)
          .not("id", "in", `(${[...excludeIds].join(",")})`)
          .order("created_at", { ascending: false })
          .limit(remaining);

        (preferred || []).forEach(p => {
          result.push(p);
          excludeIds.add(p.id);
        });
      }
    }
  }

  // ── Step 2: Fill from same category as current product ──
  if (result.length < TARGET) {
    const remaining = TARGET - result.length;
    const { data: sameCategory } = await supabase
      .from("products")
      .select("id, name, slug, price, image_url, category, is_custom, dress_components")
      .eq("category", category)
      .not("id", "in", `(${[...excludeIds].join(",")})`)
      .order("created_at", { ascending: false })
      .limit(remaining);

    (sameCategory || []).forEach(p => {
      result.push(p);
      excludeIds.add(p.id);
    });
  }

  // ── Step 3: Fill any remaining with newest products ──
  if (result.length < TARGET) {
    const remaining = TARGET - result.length;
    const { data: newest } = await supabase
      .from("products")
      .select("id, name, slug, price, image_url, category, is_custom, dress_components")
      .not("id", "in", `(${[...excludeIds].join(",")})`)
      .order("created_at", { ascending: false })
      .limit(remaining);

    (newest || []).forEach(p => result.push(p));
  }

  return result;
};

export default function YouMayAlsoLike({ currentProduct }: YouMayAlsoLikeProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["recommendations", currentProduct?.id, user?.id],
    queryFn: () =>
      fetchRecommendations(currentProduct.id, currentProduct.category, user?.id),
    enabled: !!currentProduct?.id,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mt-24 mb-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-serif text-center mb-10 tracking-wide text-foreground uppercase">
          You May Also Like
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-24 mb-16 max-w-7xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-serif text-center mb-10 tracking-wide text-foreground uppercase">
        You May Also Like
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((item: any) => {
          let displayPrice = item.price;
          let isInquiry = false;

          if (item.is_custom && item.dress_components?.length > 0) {
            displayPrice = item.dress_components[0].price || 0;
          }

          if (!displayPrice || displayPrice === 0) {
            isInquiry = true;
          }

          return (
            <div
              key={item.id}
              className="group cursor-pointer flex flex-col items-center"
              onClick={() => navigate(`/product/${item.slug || item.id}`)}
            >
              <div className="w-full aspect-[3/4] overflow-hidden mb-4 bg-muted">
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {item.category}
                </p>
                <h3 className="font-serif text-base md:text-lg text-foreground group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <div className="text-sm font-medium text-muted-foreground">
                  {isInquiry ? (
                    <span className="italic">Inquire for Price</span>
                  ) : (
                    <>
                      {item.is_custom && item.dress_components?.length > 0 && (
                        <span className="text-xs mr-1">Starts from</span>
                      )}
                      <PriceDisplay amount={displayPrice} />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
