import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { handleCTANavigation } from "@/utils/linkHelpers";

const PromotionalBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleCTAClick = () => {
    handleCTANavigation(currentBanner.cta_link, navigate);
  };

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="w-full max-w-[1500px] mx-auto relative aspect-[2/1] md:aspect-[5/1] h-auto">
        {/* Banner Content */}
        <div className="absolute inset-0">
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Text Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center text-white z-10">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 drop-shadow-md">
            {currentBanner.title}
          </h2>
          {currentBanner.description && (
            <p className="text-lg md:text-xl max-w-2xl mb-6 drop-shadow-sm">
              {currentBanner.description}
            </p>
          )}
          {currentBanner.cta_text && (
            <Button
              size="lg"
              onClick={handleCTAClick}
              className="bg-white text-black hover:bg-white/90 border-none px-8"
            >
              {currentBanner.cta_text}
            </Button>
          )}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-white/20 bg-black/20 text-white hover:bg-black/40 hover:text-white border-0"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-white/20 bg-black/20 text-white hover:bg-black/40 hover:text-white border-0"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-2'
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PromotionalBanners;
