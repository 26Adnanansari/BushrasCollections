import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    if (currentBanner.cta_link) {
      if (currentBanner.cta_link.startsWith('http')) {
        window.location.href = currentBanner.cta_link;
      } else {
        navigate(currentBanner.cta_link);
      }
    }
  };

  return (
    <section className="relative bg-accent/20 py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Banner Content */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {currentBanner.title}
              </h2>
              {currentBanner.description && (
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {currentBanner.description}
                </p>
              )}
              {currentBanner.cta_text && (
                <Button 
                  size="lg" 
                  onClick={handleCTAClick}
                  className="mt-4"
                >
                  {currentBanner.cta_text}
                </Button>
              )}
            </div>
            <div className="flex-1">
              <img
                src={currentBanner.image_url}
                alt={currentBanner.title}
                className="w-full h-[300px] object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full shadow-lg"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full shadow-lg"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanners;
