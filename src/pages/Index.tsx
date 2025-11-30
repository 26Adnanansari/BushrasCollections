import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PromotionalBanners from "@/components/PromotionalBanners";
import LatestProducts from "@/components/LatestProducts";
import FeaturedProducts from "@/components/FeaturedProducts";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <PromotionalBanners />
      <LatestProducts />
      <FeaturedProducts />
      <AboutSection />
      <Footer />
    </main>
  );
};

export default Index;
