import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Mail, Phone, MapPin, Shield, Camera, CheckCircle, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AvatarSelectionModal } from "@/components/AvatarSelectionModal";
import { VerificationModal } from "@/components/VerificationModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface NotificationPreferences {
  order_status_notifications: boolean;
  promotion_notifications: boolean;
  profile_health_notifications: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
}

const Profile = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileHealth, setProfileHealth] = useState(0);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    order_status_notifications: true,
    promotion_notifications: true,
    profile_health_notifications: true,
    whatsapp_enabled: false,
    email_enabled: true,
  });

  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);


  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfileData();
  }, [user, navigate]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (profileError) throw profileError;

      setName(profile.name || "");
      setEmail(user!.email || "");
      setPhone(profile.phone || "");
      setPhoneVerified(profile.phone_verified || false);
      setAddress(typeof profile.address === 'string' ? profile.address : JSON.stringify(profile.address || ""));
      setAvatarUrl((profile as any).avatar_url || "");
      setProfileHealth((profile as any).profile_health_score || 0);

      // Fetch notification preferences - will work after migration
      const { data: prefs, error: prefsError } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (prefsError) {
        console.log("Notification preferences not yet available:", prefsError);
      }

      if (prefs) {
        setNotificationPrefs(prefs as any);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = async () => {
    try {
      const { data, error } = await supabase.rpc("calculate_profile_health" as any, {
        user_id: user!.id,
      });

      if (!error && data !== null) {
        setProfileHealth(data as number);
        await supabase
          .from("profiles")
          .update({ profile_health_score: data } as any)
          .eq("id", user!.id);
      }
    } catch (err) {
      console.log("Health score calculation not yet available");
    }
  };

  const handleStartPhoneVerification = () => {
    setIsVerificationOpen(true);
  };

  const handleSendVerificationCode = async () => {
    // 1. Trigger Supabase 'updateUser' with the new phone number.
    // This sends an OTP to that phone if using a real provider.
    const { error } = await supabase.auth.updateUser({
      phone: phone
    });

    if (error) throw error;
  };

  const handleVerifyOTP = async (token: string) => {
    // 2. Verify the OTP token. 
    // Type 'phone_change' is standard when verifying a new phone on an existing user.
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'phone_change'
    });

    if (error) throw error;

    // 3. Update the profile to mark as verified (optional, as Supabase Auth user object now has phone_confirmed_at)
    // But we prefer keeping our 'profiles' table in sync.
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ phone_verified: true, phone: phone } as any)
      .eq("id", user!.id);

    if (dbError) console.error("Error updating profile verified status:", dbError);

    setPhoneVerified(true);
  };

  const handleVerificationSuccess = () => {
    toast({
      title: "Success",
      description: "Phone number verified successfully",
    });
    // Modal closes automatically via component logic
    setIsVerificationOpen(false);
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setIsPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any)
        .eq("id", user!.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await calculateHealthScore();

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          phone,
          address,
        })
        .eq("id", user!.id);

      if (profileError) throw profileError;

      // Update notification preferences - will work after migration
      try {
        const { error: prefsError } = await supabase
          .from("profiles" as any)
          .upsert({
            user_id: user!.id,
            ...notificationPrefs,
          });

        if (prefsError) {
          console.log("Notification preferences not yet available");
        }
      } catch (err) {
        console.log("Notification system not yet set up");
      }

      await calculateHealthScore();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getHealthSuggestions = () => {
    const suggestions = [];
    if (!email.includes("@") || profileHealth < 25) suggestions.push("Verify your email address");
    if (!phone) suggestions.push("Add phone number to unlock WhatsApp recovery");
    if (!address) suggestions.push("Complete your address for faster checkout");
    if (!avatarUrl) suggestions.push("Upload an avatar to personalize your profile");
    return suggestions;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Health Widget */}
          <Card className={`border-2 ${profileHealth === 100 ? 'border-green-500' : 'border-yellow-500'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {profileHealth === 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    Profile Health: {profileHealth}%
                  </CardTitle>
                  <CardDescription>
                    {profileHealth === 100 ? "Your profile is complete!" : "Complete your profile to unlock all features"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {profileHealth < 100 && (
              <CardContent>
                <div className="space-y-2">
                  {getHealthSuggestions().map((suggestion, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      {suggestion}
                    </p>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="text-2xl">
                    {name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAvatarModal(true)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Avatar
                    </Button>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button variant="outline" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Custom
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose from presets or upload your own (Max 2MB)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone">Phone / WhatsApp Number</Label>
                    {phone && (
                      <Badge variant={phoneVerified ? "default" : "secondary"}>
                        {phoneVerified ? "Verified" : "Unverified"}
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="pl-10"
                    />
                  </div>
                  {phone && !phoneVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartPhoneVerification}
                      className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    >
                      Verify Phone Number
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your address"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-fit">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your new password below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
                      <Button onClick={handlePasswordUpdate} disabled={passwordLoading}>
                        {passwordLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Types */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Status Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your order is processing, shipped, or delivered
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.order_status_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, order_status_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Promotions & Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new products and special offers
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.promotion_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, promotion_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Health Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders to complete your profile
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.profile_health_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, profile_health_notifications: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Delivery Methods */}
              <div className="space-y-4">
                <Label className="text-base">Delivery Methods</Label>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="text-green-600">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        {phone ? "Instant updates via WhatsApp" : "Add phone number to enable"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.whatsapp_enabled}
                    disabled={!phone}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, whatsapp_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_enabled}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, email_enabled: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} size="lg">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>

      <Footer />

      <AvatarSelectionModal
        open={showAvatarModal}
        onSelect={async (url) => {
          try {
            const { error } = await supabase
              .from("profiles")
              .update({ avatar_url: url })
              .eq("id", user!.id);

            if (error) throw error;

            setAvatarUrl(url);
            setShowAvatarModal(false);
            await calculateHealthScore();

            toast({
              title: "Success",
              description: "Avatar updated successfully",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to update avatar",
              variant: "destructive",
            });
          }
        }}
        onClose={() => setShowAvatarModal(false)}
        currentAvatar={avatarUrl}
      />

      <VerificationModal
        open={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        phone={phone}
        onSendCode={handleSendVerificationCode}
        onVerifyCode={handleVerifyOTP}
        onVerified={handleVerificationSuccess}
      />
    </div>
  );
};

export default Profile;
