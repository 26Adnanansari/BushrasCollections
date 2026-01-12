import { useEffect, Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { useVisitorStore } from "@/store/visitor";
import { useWishlistStore } from "@/store/wishlist";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PageLoader from "@/components/PageLoader";
import { ViralHandshake } from "@/components/ViralHandshake";

// Lazy Load Pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ClientDairyPost = lazy(() => import("./pages/ClientDairyPost"));
const ClientDairy = lazy(() => import("./pages/ClientDairy"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminHeroSlider = lazy(() => import("./pages/admin/HeroSlider"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminTeam = lazy(() => import("./pages/admin/Team"));
const Promotions = lazy(() => import("./pages/admin/Promotions"));
const AdminPermissionManagement = lazy(() => import("./pages/admin/PermissionManagement"));
const AdminOrderDetails = lazy(() => import("./pages/admin/OrderDetails"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/PaymentMethods"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AnalyticsHelp = lazy(() => import("./pages/admin/AnalyticsHelp"));
const ShippingSettings = lazy(() => import("./pages/admin/ShippingSettings"));
const OfferManagement = lazy(() => import("./pages/admin/OfferManagement"));
const AdminSocialAnalytics = lazy(() => import("./pages/admin/SocialAnalytics"));
const AdminClientDairy = lazy(() => import("./pages/admin/ClientDairy"));

const App = () => {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeVisitor = useVisitorStore((state) => state.initialize);
  const initializeWishlist = useWishlistStore((state) => state.initialize);
  const location = useLocation();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Pulse session on every route change (handles timeouts and campaigns)
  useEffect(() => {
    initializeVisitor();

    // Register Service Worker for Push Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => console.log('[SW] Registered:', reg.scope))
        .catch((err) => console.error('[SW] Registration failed:', err));
    }
  }, [initializeVisitor, location.pathname, location.search]);

  // DEBUG: Track window focus and visibility
  useEffect(() => {
    const handleFocus = () => {
      console.log("[APP DEBUG] Window gained focus at:", new Date().toLocaleTimeString());
    };
    const handleVisibilityChange = () => {
      console.log("[APP DEBUG] Visibility changed to:", document.visibilityState, "at:", new Date().toLocaleTimeString());
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Init wishlist whenever auth status changes (implicitly handled by store but good to trigger)
  useEffect(() => {
    initializeWishlist();
  }, [initializeWishlist]);

  return (
    <TooltipProvider>
      <Suspense fallback={<PageLoader />}>
        <ViralHandshake />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/client-dairy" element={<ClientDairy />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/client-dairy/post/:orderId" element={<ProtectedRoute><ClientDairyPost /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/banners" element={<ProtectedRoute requireAdmin><AdminBanners /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/orders/:orderId" element={<ProtectedRoute requireAdmin><AdminOrderDetails /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/hero-slider" element={<ProtectedRoute requireAdmin><AdminHeroSlider /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/analytics-help" element={<ProtectedRoute requireAdmin><AnalyticsHelp /></ProtectedRoute>} />
          <Route path="/admin/team" element={<ProtectedRoute requireAdmin><AdminTeam /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute requireAdmin><Promotions /></ProtectedRoute>} />
          <Route path="/admin/client-dairy" element={<ProtectedRoute requireAdmin><AdminClientDairy /></ProtectedRoute>} />
          <Route path="/admin/permissions" element={<ProtectedRoute requireSuperAdmin><AdminPermissionManagement /></ProtectedRoute>} />
          <Route path="/admin/payment-methods" element={<ProtectedRoute requireAdmin><AdminPaymentMethods /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/shipping" element={<ProtectedRoute requireAdmin><ShippingSettings /></ProtectedRoute>} />
          <Route path="/admin/offers" element={<ProtectedRoute requireAdmin><OfferManagement /></ProtectedRoute>} />
          <Route path="/admin/social-analytics" element={<ProtectedRoute requireAdmin><AdminSocialAnalytics /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  );
};

export default App;
