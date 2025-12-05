import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import { authService } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useAuthStore } from "@/store/auth";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format (e.g., +1234567890)'),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({});
  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; phone?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, initialized, loading } = useAuthStore();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Single unified redirect effect - wait for auth to fully initialize including roles
  useEffect(() => {
    // Wait for initialization to complete AND loading to finish
    if (!initialized || loading || !user) return;

    const roles = user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');

    // Determine redirect destination based on role
    const redirectTo = isAdmin ? '/admin' : '/dashboard';

    console.log('🔄 Auth redirect:', {
      userEmail: user.email,
      roles,
      isAdmin,
      from,
      redirectTo
    });

    navigate(redirectTo, { replace: true });
  }, [initialized, loading, user, navigate, from]);

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignInErrors({});
    try {
      const validatedData = signInSchema.parse(signInForm);
      setIsSigningIn(true);

      const { data, error } = await authService.signIn(
        validatedData.email,
        validatedData.password
      );

      if (error) {
        const msg = error.message || "Failed to sign in";
        const friendly =
          msg.includes("Invalid login credentials")
            ? "Incorrect email or password."
            : msg.includes("Email not confirmed")
              ? "Please verify your email to continue."
              : msg;
        setError(friendly);
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        // Fetch user roles for immediate redirect
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const roles = userRoles?.map(r => r.role) || [];
        const isAdmin = roles.includes('admin') || roles.includes('super_admin');

        // Determine redirect destination based on role
        const redirectTo = isAdmin ? '/admin' : '/dashboard';

        console.log('🔄 Sign-in redirect:', {
          userEmail: data.user.email,
          roles,
          isAdmin,
          redirectTo
        });

        // Immediate redirect after sign-in
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.issues.forEach((i) => {
          if (i.path?.[0]) fieldErrors[i.path[0]] = i.message;
        });
        setSignInErrors(fieldErrors);
        setError("Please fix the highlighted fields.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignUpErrors({});
    try {
      const validatedData = signUpSchema.parse(signUpForm);
      setIsSigningUp(true);

      const { data, error } = await authService.signUp(
        validatedData.email,
        validatedData.password,
        validatedData.name,
        validatedData.phone
      );

      if (error) {
        const msg = error.message || "Failed to create account";
        setError(msg);
        return;
      }

      if (data.user) {
        // Store email for success dialog
        setSignUpEmail(validatedData.email);
        setShowSuccessDialog(true);

        // Clear form
        setSignUpForm({
          name: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.issues.forEach((i) => {
          if (i.path?.[0]) fieldErrors[i.path[0]] = i.message;
        });
        setSignUpErrors(fieldErrors);
        setError("Please fix the highlighted fields.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSocialLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message || "Failed to sign in with Google";
      const friendly = msg.includes("redirect_uri_mismatch")
        ? "Google sign-in misconfiguration: add Authorized redirect URI https://htywmazgmcqwwwjvcigw.supabase.co/auth/v1/callback and include your app URLs under Authorized JavaScript origins."
        : msg;
      setError(friendly);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setError("");
    setIsSocialLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with Facebook");
    } finally {
      setIsSocialLoading(false);
    }
  };

  // Social auth rendering: Google temporarily disabled for testing
  const googleEnabled = false;
  const facebookEnabled = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);

  return (
    <div className="min-h-screen bg-gradient-elegant flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Bushra's Collection
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account or create a new one
            </p>
          </div>
        </div>

        <Card>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInForm.email}
                      onChange={(e) =>
                        setSignInForm({ ...signInForm, email: e.target.value })
                      }
                      disabled={isSigningIn || isSocialLoading}
                      required
                      aria-invalid={!!signInErrors.email}
                    />
                    {signInErrors.email && (
                      <p className="text-sm text-destructive">{signInErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        value={signInForm.password}
                        onChange={(e) =>
                          setSignInForm({ ...signInForm, password: e.target.value })
                        }
                        disabled={isSigningIn || isSocialLoading}
                        required
                        aria-invalid={!!signInErrors.password}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signInErrors.password && (
                      <p className="text-sm text-destructive">{signInErrors.password}</p>
                    )}
                  </div>
                  {error && (
                    <Alert variant="destructive" role="alert" aria-live="polite">
                      <AlertDescription>{error.includes('redirect_uri_mismatch') ? 'Google sign-in misconfiguration detected. Please verify OAuth settings.' : error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isSigningIn || isSocialLoading}>
                    {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>

                  {(googleEnabled || facebookEnabled) && (
                    <>
                      <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">Or continue with</span>
                        <Separator className="flex-1" />
                      </div>

                      <div className="flex justify-center gap-3">
                        {googleEnabled && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoogleSignIn}
                            disabled={isSocialLoading || isSigningIn || isSigningUp}
                          >
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                          </Button>
                        )}

                        {facebookEnabled && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleFacebookSignIn}
                            disabled={isSocialLoading || isSigningIn || isSigningUp}
                          >
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Create a new account to start shopping
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      value={signUpForm.name}
                      onChange={(e) =>
                        setSignUpForm({ ...signUpForm, name: e.target.value })
                      }
                      required
                      aria-invalid={!!signUpErrors.name}
                    />
                    {signUpErrors.name && (
                      <p className="text-sm text-destructive">{signUpErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={signUpForm.phone}
                      onChange={(e) =>
                        setSignUpForm({ ...signUpForm, phone: e.target.value })
                      }
                      required
                      aria-invalid={!!signUpErrors.phone}
                    />
                    {signUpErrors.phone && (
                      <p className="text-sm text-destructive">{signUpErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpForm.email}
                      onChange={(e) =>
                        setSignUpForm({ ...signUpForm, email: e.target.value })
                      }
                      required
                      aria-invalid={!!signUpErrors.email}
                    />
                    {signUpErrors.email && (
                      <p className="text-sm text-destructive">{signUpErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpForm.password}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, password: e.target.value })
                        }
                        required
                        aria-invalid={!!signUpErrors.password}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signUpErrors.password && (
                      <p className="text-sm text-destructive">{signUpErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signUpForm.confirmPassword}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })
                        }
                        required
                        aria-invalid={!!signUpErrors.confirmPassword}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signUpErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{signUpErrors.confirmPassword}</p>
                    )}
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isSigningUp || isSocialLoading}>
                    {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>

                  {(googleEnabled || facebookEnabled) && (
                    <>
                      <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">Or sign up with</span>
                        <Separator className="flex-1" />
                      </div>

                      <div className="flex justify-center gap-3">
                        {googleEnabled && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoogleSignIn}
                            disabled={isSocialLoading || isSigningIn || isSigningUp}
                          >
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                          </Button>
                        )}

                        {facebookEnabled && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleFacebookSignIn}
                            disabled={isSocialLoading || isSigningIn || isSigningUp}
                          >
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Success Dialog */}
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Thank You for Joining!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Welcome to Bushra's Collection
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Please check your email to verify your account:
                </p>
                <p className="font-medium text-lg break-all">
                  {signUpEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the verification link in your email to activate your account and start shopping!
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setShowSuccessDialog(false)}
                  className="w-full"
                >
                  Got it!
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;