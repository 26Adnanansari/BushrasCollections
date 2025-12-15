import { Button } from "@/components/ui/button";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-10 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              About Bushra's Collection
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              We are passionate about bringing you the finest in traditional and contemporary fashion.
              Our carefully curated collection represents the perfect blend of timeless elegance and
              modern sophistication.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              From exquisite traditional pieces to stunning contemporary designs, each item in our
              collection is selected with the utmost attention to quality, craftsmanship, and style.
            </p>

            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">+92 319 628 7472</p>
                  <p className="text-sm text-muted-foreground">Call or WhatsApp</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Ghousia Center</p>
                  <p className="text-sm text-muted-foreground">Opposite Mubarkar Masjid, Gizri, Karachi</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image/Stats */}
          <div className="relative">
            <div className="bg-gradient-elegant rounded-2xl p-8 shadow-elegant">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">500+</div>
                  <div className="text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100+</div>
                  <div className="text-muted-foreground">Unique Designs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">5★</div>
                  <div className="text-muted-foreground">Customer Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">3+</div>
                  <div className="text-muted-foreground">Years Experience</div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-background/50 rounded-xl border border-border">
                <blockquote className="text-center">
                  <p className="text-foreground font-medium mb-4">
                    "Quality, elegance, and exceptional service. Bushra's Collection never disappoints!"
                  </p>
                  <footer className="text-sm text-muted-foreground">- Satisfied Customer</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;