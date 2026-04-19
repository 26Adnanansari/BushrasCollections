import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Instagram, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone must be less than 20 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters")
});

import { useEffect } from "react";

const Contact = () => {
  const [locations, setLocations] = useState<{name: string, url: string}[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'google_maps').single();
        if (data && data.value && data.value.locations) {
          setLocations(data.value.locations);
        }
      } catch (e) {
        console.error("Failed to map settings", e);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Submit to Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([validatedData]);

      if (error) throw error;

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-elegant">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We'd love to hear from you. Get in touch with any questions, feedback, or just to say hello
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Information */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          required
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+92 319 628 7472"
                          required
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="What's this about?"
                          required
                          maxLength={200}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        required
                        maxLength={1000}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="shadow-elegant">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-6">Get in Touch</h3>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Visit Our Store</h4>
                        <div className="text-muted-foreground mb-4 space-y-6">
                          <div>
                            <span className="font-medium text-primary block mb-2">Outlet 1: Bukhari Commercial</span>
                            <p className="mb-3 text-sm">13C Ln 5, Bukhari Commercial D.H.A Phase 6, Karachi.</p>
                            <iframe
                              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3621.99742653508!2d67.06267787529478!3d24.795541647852307!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33d002dea5511%3A0xd9378c83300b0caf!2sBushra&#39;s%20collection!5e0!3m2!1sen!2s!4v1776613501141!5m2!1sen!2s"
                              width="100%"
                              height="250"
                              style={{ border: 0 }}
                              allowFullScreen={true}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="rounded-xl border border-border shadow-sm"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-primary block mb-2">Outlet 2: Gizri</span>
                            <p className="mb-3 text-sm">Ghousia Center, Opposite Mubarkar Masjid, Gizri, Karachi, Pakistan</p>
                            <iframe
                              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3621.291829608294!2d67.04465147529542!3d24.819691746887884!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33d5fd72d92bf%3A0xb416413e63bda142!2sBushra&#39;s%20collection!5e0!3m2!1sen!2s!4v1776613605588!5m2!1sen!2s"
                              width="100%"
                              height="250"
                              style={{ border: 0 }}
                              allowFullScreen={true}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="rounded-xl border border-border shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Call & WhatsApp</h4>
                        <p className="text-muted-foreground">+92 323 3228259</p>
                        <p className="text-sm text-muted-foreground">Available 10 AM - 8 PM</p>
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
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="shadow-elegant">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-6">Follow Us</h3>

                  <div className="space-y-4">
                    <a
                      href="#"
                      className="flex items-center gap-4 p-4 bg-gradient-subtle rounded-lg hover:shadow-elegant transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Instagram className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Instagram</div>
                        <div className="text-sm text-muted-foreground">@bushra.collection</div>
                      </div>
                    </a>

                    <a
                      href="#"
                      className="flex items-center gap-4 p-4 bg-gradient-subtle rounded-lg hover:shadow-elegant transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Facebook className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Facebook</div>
                        <div className="text-sm text-muted-foreground">bushra.com.pk</div>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Quick Links */}
              <Card className="shadow-elegant">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-6">Quick Help</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Shipping & No Return Policy
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Size Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Care Instructions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Track Your Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Contact;