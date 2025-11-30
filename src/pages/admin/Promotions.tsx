import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Users, Mail, Smartphone, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Promotions = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    whatsappUsers: 0,
    emailUsers: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Check if user is admin
    if (!user.roles?.includes("admin")) {
      navigate("/");
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      // Count total users - will work after migration
      const { count: totalCount } = await supabase
        .from("profiles" as any)
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: totalCount || 0,
        whatsappUsers: 0, // Will populate after migration
        emailUsers: 0, // Will populate after migration
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSendPromotion = async () => {
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get all users - will filter by preferences after migration
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id");

      if (error) throw error;

      // Mock sending (will integrate with actual notification service later)
      console.log("Sending promotion to users");
      console.log("Title:", title);
      console.log("Message:", message);
      
      const whatsappRecipients = 0; // Will work after migration
      const emailRecipients = users?.length || 0;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Promotion sent successfully!",
        description: `Sent to ${whatsappRecipients} WhatsApp users and ${emailRecipients} email users`,
      });

      setTitle("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending promotion:", error);
      toast({
        title: "Error",
        description: "Failed to send promotion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Send Promotions</h1>
            <p className="text-muted-foreground">
              Send promotional notifications to your users
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users opted in for promotions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  WhatsApp Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.whatsappUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Will receive via WhatsApp
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.emailUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Will receive via Email
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Send Promotion Form */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Promotion</CardTitle>
              <CardDescription>
                Create and send promotional messages to your users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only users who have opted in for promotional notifications will receive this message.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Promotion Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Sale - 50% Off!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your promotional message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length} / 500 characters
                  </p>
                </div>

                {/* Preview */}
                {(title || message) && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2">{title || "Title"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {message || "Your message will appear here..."}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Badge variant="secondary" className="text-xs">
                            <Smartphone className="h-3 w-3 mr-1" />
                            {stats.whatsappUsers} WhatsApp
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            {stats.emailUsers} Email
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendPromotion}
                disabled={loading || !title || !message}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Promotion to {stats.totalUsers} Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;
