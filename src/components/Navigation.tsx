import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Menu, X, User, Search, LogOut, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartDrawer from "./CartDrawer";
import { SearchOverlay } from "./SearchOverlay";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (!error) {
      // Clear auth store to prevent admin dashboard access
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setSession(null);
      toast({ title: "Signed out successfully" });
      navigate("/");
      window.location.reload(); // Force refresh to clear all state
    }
  };

  const isAdmin = user?.roles?.includes('admin') || false;
  const isSuperAdmin = (user?.roles as any)?.includes('super_admin') || false;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    ...(user ? [{ name: "Profile", href: "/profile" }, { name: "Wishlist", href: "/wishlist" }, { name: "Orders", href: "/orders" }] : []),
    ...(isAdmin ? [{ name: "Dashboard", href: "/admin" }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block">
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Bushra's Collection
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.href.startsWith('/#') ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-accent">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile?.avatar_url || ''} alt={user.profile?.name || 'User'} />
                      <AvatarFallback>
                        <UserCircle2 className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{user.profile?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    My Orders
                  </DropdownMenuItem>
                  {(isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <User className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}

            <CartDrawer>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </CartDrawer>
          </div>

          {/* Mobile Menu & Cart */}
          <div className="md:hidden flex items-center gap-2">
            <CartDrawer>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </CartDrawer>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-accent"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        <SearchOverlay open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
            isMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4 space-y-4">
            {navLinks.map((link) => (
              link.href.startsWith('/#') ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-foreground hover:text-primary transition-colors duration-200 font-medium py-2 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-foreground hover:text-primary transition-colors duration-200 font-medium py-2 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
            ))}
            <div className="flex flex-col space-y-4 pt-4 border-t border-border">
              <Button variant="ghost" size="icon" className="hover:bg-accent w-full" onClick={() => { setIsMenuOpen(false); setIsSearchOpen(true); }}>
                <Search className="h-5 w-5" />
              </Button>

              {user ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile?.avatar_url || ''} alt={user.profile?.name || 'User'} />
                      <AvatarFallback>
                        <UserCircle2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.profile?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}

              <CartDrawer>
                <Button variant="ghost" size="icon" className="hover:bg-accent w-full">
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              </CartDrawer>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;