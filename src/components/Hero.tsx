import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import heroImage from "@/assets/hero-fashion.jpg";

interface HeroSlide {
  id: string;
  image_url?: string;
  image?: string;
  media_url?: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  order_index: number;
  is_active: boolean;
}

const Hero = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setSlides(data);
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
    }
  };

  // Fallback to default hero if no slides
  if (slides.length === 0) {
    return (
      <section id="home" className="relative min-h-screen overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 xl:px-16 h-auto md:h-screen flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12 py-12 md:py-0">
          {/* Text Content - Left Side */}
          <div className="w-full md:w-1/2 pt-20 md:pt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-foreground mb-4 md:mb-6 leading-tight">
              Elegant
              <span className="block text-primary">Fashion</span>
              Collection
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
              Discover timeless elegance with our curated collection of traditional and contemporary designs
            </p>

            <Button size="lg" className="bg-gradient-hero hover:shadow-elegant transition-all duration-300 group w-full sm:w-auto">
              Shop Collection
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Image - Right Side */}
          <div className="w-full md:w-1/2 h-[60vh] md:h-[85vh] relative">
            <img
              src={heroImage}
              alt="Elegant fashion collection featuring traditional and modern designs"
              className="w-full h-full object-contain"
              loading="eager"
            />
            <div
              className="hidden md:block lg:hidden absolute inset-y-0 left-0 w-[10%] backdrop-blur-sm pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      <Carousel
        setApi={setApi}
        className="w-full h-screen"
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
          }),
        ]}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="container mx-auto px-6 lg:px-12 xl:px-16 h-auto md:h-screen flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12 py-12 md:py-0">
                {/* Text Content - Left Side */}
                <div className="w-full md:w-1/2 pt-20 md:pt-0 animate-fade-in">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-foreground mb-4 md:mb-6 leading-tight">
                    {slide.title || "Elegant Fashion Collection"}
                  </h1>

                  <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
                    {slide.subtitle || "Discover timeless elegance"}
                  </p>

                  {slide.cta_text && (
                    <Button
                      size="lg"
                      className="bg-gradient-hero hover:shadow-elegant transition-all duration-300 group w-full sm:w-auto"
                      onClick={() => slide.cta_link && (window.location.href = slide.cta_link)}
                    >
                      {slide.cta_text}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>

                {/* Media - Right Side */}
                <div className="w-full md:w-1/2 h-[60vh] md:h-[85vh] relative">
                  <img
                    src={(slide as any).image_url || (slide as any).image || (slide as any).media_url || heroImage}
                    alt={slide.title || "Hero slide"}
                    className="w-full h-full object-contain"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div
                    className="hidden md:block lg:hidden absolute inset-y-0 left-0 w-[10%] backdrop-blur-sm pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows */}
        <CarouselPrevious className="left-4 h-12 w-12 border-2 border-white/20 bg-background/20 backdrop-blur-sm hover:bg-background/40" />
        <CarouselNext className="right-4 h-12 w-12 border-2 border-white/20 bg-background/20 backdrop-blur-sm hover:bg-background/40" />

        {/* Dots Indicator */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${current === index ? "w-8 bg-primary" : "w-2 bg-white/50"
                }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;