import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Promotions from "./pages/admin/Promotions";
import { useAuthStore } from "@/store/auth";
import { useVisitorStore } from "@/store/visitor";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBanners from "./pages/admin/Banners";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminHeroSlider from "./pages/admin/HeroSlider";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminTeam from "./pages/admin/Team";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminPermissionManagement from "./pages/admin/PermissionManagement";
import AdminOrderDetails from "./pages/admin/OrderDetails";
import AdminPaymentMethods from "./pages/admin/PaymentMethods";
import AdminReviews from "./pages/admin/Reviews";

const App = () => {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeVisitor = useVisitorStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
    initializeVisitor();
  }, [initializeAuth, initializeVisitor]);

  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Index />} />
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
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/banners" element={<ProtectedRoute requireAdmin><AdminBanners /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/orders/:orderId" element={<ProtectedRoute requireAdmin><AdminOrderDetails /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/hero-slider" element={<ProtectedRoute requireAdmin><AdminHeroSlider /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/team" element={<ProtectedRoute requireAdmin><AdminTeam /></ProtectedRoute>} />
        <Route path="/admin/promotions" element={<ProtectedRoute requireAdmin><Promotions /></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute requireSuperAdmin><AdminPermissionManagement /></ProtectedRoute>} />
        <Route path="/admin/payment-methods" element={<ProtectedRoute requireAdmin><AdminPaymentMethods /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
};

export default App;
