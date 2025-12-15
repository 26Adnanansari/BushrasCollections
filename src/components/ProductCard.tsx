import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  slug?: string;
  name: string;
  price: number;
  image: string | string[] | null;
  category: string | null;
  isNew?: boolean;
  averageRating?: number;
  totalReviews?: number;
}

const ProductCard = ({ id, slug, name, price, image, category, isNew, averageRating = 0, totalReviews = 0 }: ProductCardProps) => {
  const { addItem: addToCart } = useCartStore();
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isLiked = isInWishlist(id);

  const images: string[] = Array.isArray(image) && image.length > 0 ? image : image ? [image as string] : ['/placeholder.svg'];
  const displayImage: string = images[currentImageIndex] || images[0] || '/placeholder.svg';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const firstImage: string = images[0] || '/placeholder.svg';
    addToCart({
      id,
      name,
      price,
      image: firstImage,
      category: category || 'Fashion',
    });

    toast({
      title: "Added to cart",
      description: `${name} has been added to your cart.`,
    });
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to your wishlist",
        variant: "destructive"
      });
      return;
    }

    if (isLiked) {
      await removeFromWishlist(id);
      toast({
        title: "Removed from wishlist",
        description: "Item removed from your wishlist"
      });
    } else {
      await addToWishlist(id);
      toast({
        title: "Added to wishlist",
        description: "Item added to your wishlist"
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const imageWidth = rect.width / images.length;
    const index = Math.min(Math.floor(x / imageWidth), images.length - 1);
    setCurrentImageIndex(index);
  };

  return (
    <Link to={`/product/${slug || id}`} className="block">
      <div
        className="group relative bg-card rounded-lg overflow-hidden shadow-product hover:shadow-elegant transition-all duration-500"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0);
        }}
      >
        {/* Product Image */}
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-lg"
          onMouseMove={handleMouseMove}
        >
          <img
            src={displayImage || '/placeholder.svg'}
            alt={name}
            className={cn(
              "w-full h-full object-contain transition-transform duration-700",
              isHovered ? "scale-105" : "scale-100"
            )}
          />

          {/* Image indicators for multiple images */}
          {images.length > 1 && isHovered && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    idx === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Overlay on Hover */}
          <div className={cn(
            "absolute inset-0 bg-primary/20 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )} />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isNew && (
              <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-full">
                New
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-4 right-4 bg-background/80 hover:bg-background transition-all duration-300",
              isHovered || isLiked ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
            onClick={handleWishlistClick}
          >
            <Heart className={cn("h-4 w-4", isLiked ? "fill-primary text-primary" : "text-foreground")} />
          </Button>

          {/* Action Buttons */}
          <div className={cn(
            "absolute bottom-4 left-4 right-4 flex gap-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Button
              className="flex-1 bg-gradient-hero hover:shadow-elegant transition-all duration-300 group"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Add to Cart
            </Button>
            <Button variant="outline" className="bg-background/80 hover:bg-background">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 md:p-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{category || 'Fashion'}</p>
          <h3 className="font-serif text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {name}
          </h3>
          <div className="flex flex-col gap-1">
            <span className="text-lg md:text-2xl font-bold text-primary">
              Rs. {price.toLocaleString()}
            </span>
            {totalReviews > 0 ? (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={cn(
                        "text-sm",
                        star <= Math.round(averageRating) ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">({totalReviews})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;