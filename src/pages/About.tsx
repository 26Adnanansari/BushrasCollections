import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from "lucide-react";

const About = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-elegant">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">
              About Bushra's Collection
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Where tradition meets contemporary elegance - crafting timeless fashion since our inception
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold text-foreground mb-6">
                Our Story
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Bushra's Collection was born from a passion for celebrating the rich heritage of traditional fashion 
                while embracing the dynamic spirit of contemporary design. Founded with a vision to bring you the 
                finest curated pieces that speak to both tradition and modernity.
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Every piece in our collection is carefully selected for its exceptional quality, intricate craftsmanship, 
                and timeless appeal. We believe that fashion is not just about clothing—it's about expressing your 
                identity, celebrating your heritage, and feeling confident in your own skin.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From luxurious traditional ensembles perfect for special occasions to contemporary pieces that 
                elevate your everyday wardrobe, our collection offers something special for every woman who 
                appreciates quality and style.
              </p>
            </div>
            
            <div className="bg-gradient-subtle rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">1000+</div>
                  <div className="text-sm text-muted-foreground">Products Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">5⭐</div>
                  <div className="text-sm text-muted-foreground">Customer Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Customer Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gradient-elegant">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-background rounded-2xl shadow-elegant">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Quality First</h3>
              <p className="text-muted-foreground leading-relaxed">
                We never compromise on quality. Every piece is carefully inspected and meets our highest standards 
                before reaching you.
              </p>
            </div>
            
            <div className="text-center p-8 bg-background rounded-2xl shadow-elegant">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Instagram className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Authentic Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our designs celebrate authentic craftsmanship while incorporating contemporary elements that resonate 
                with modern sensibilities.
              </p>
            </div>
            
            <div className="text-center p-8 bg-background rounded-2xl shadow-elegant">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Customer Care</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your satisfaction is our priority. We provide personalized service and support to ensure you 
                have the best shopping experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">
              Visit Our Store
            </h2>
            <p className="text-xl text-muted-foreground">
              Experience our collection in person at our flagship location
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-6">Store Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Address</h4>
                    <p className="text-muted-foreground">
                      Ghousia Center, Opposite Mubarkar Masjid<br />
                      Gizri, Karachi, Pakistan
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Phone</h4>
                    <p className="text-muted-foreground">+92 319 628 7472</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Email</h4>
                    <p className="text-muted-foreground">info@bushrascollection.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Store Hours</h4>
                    <p className="text-muted-foreground">
                      Monday - Saturday: 10:00 AM - 8:00 PM<br />
                      Sunday: 12:00 PM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-6">Follow Us</h3>
              
              <div className="space-y-4 mb-8">
                <a 
                  href="#" 
                  className="flex items-center gap-4 p-4 bg-gradient-subtle rounded-lg hover:shadow-elegant transition-all duration-300"
                >
                  <Instagram className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Instagram</div>
                    <div className="text-sm text-muted-foreground">@bushra.collection</div>
                  </div>
                </a>
                
                <a 
                  href="#" 
                  className="flex items-center gap-4 p-4 bg-gradient-subtle rounded-lg hover:shadow-elegant transition-all duration-300"
                >
                  <Facebook className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Facebook</div>
                    <div className="text-sm text-muted-foreground">bushra.com.pk</div>
                  </div>
                </a>
              </div>
              
              <Button className="w-full" size="lg">
                Get Directions
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;