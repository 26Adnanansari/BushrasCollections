import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images: string[] = Array.isArray(image) && image.length > 0 ? image : image ? [image as string] : ['/placeholder.svg'];
  const displayImage: string = images[currentImageIndex] || images[0] || '/placeholder.svg';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const firstImage: string = images[0] || '/placeholder.svg';
    addItem({
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
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
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
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">{category || 'Fashion'}</p>
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
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