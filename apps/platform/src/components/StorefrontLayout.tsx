import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Heart,
  Search,
  MapPin,
  ChevronDown,
  AlertCircle, 
  ArrowRight,
  Loader2,
  Trash2,
  Minus,
  Plus
} from "lucide-react";
import { useCartStore } from "../lib/cartStore";
import { apiRequest, logoutCustomer } from "../lib/api";
import { User as CustomerUser } from "../types";

interface StorefrontLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export default function StorefrontLayout({ currentRoute, onNavigate, children }: StorefrontLayoutProps) {
  const { items, getTotalItems, getTotalPrice, updateQuantity, removeItem } = useCartStore();

  const [activeCustomer, setActiveCustomer] = useState<CustomerUser | null>(null);
  
  // Shopping List slide drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Header scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Secure customer auth popup modal states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sync current authenticated customer
  useEffect(() => {
    async function loadMe() {
      try {
        const me = await apiRequest<CustomerUser>("/auth/me", "GET");
        if (me) {
          setActiveCustomer(me);
          localStorage.setItem("cromatic_active_customer", JSON.stringify(me));
        }
      } catch (_) {
        // Try loading from cache if API fails
        const activeCustomerJson = localStorage.getItem("cromatic_active_customer");
        if (activeCustomerJson) {
          try {
            const parsed = JSON.parse(activeCustomerJson);
            if (parsed && parsed.id && parsed.email) {
              setActiveCustomer(parsed);
            } else {
              localStorage.removeItem("cromatic_active_customer");
            }
          } catch (_) {
            localStorage.removeItem("cromatic_active_customer");
          }
        }
      }
    }
    loadMe();
  }, [isAuthOpen]);

  // Handle logout
  const handleCustomerLogout = async () => {
    try {
      await apiRequest("/auth/logout", "POST");
    } catch (_) {}
    logoutCustomer();
    setActiveCustomer(null);
    onNavigate("home");
  };

  // Secure login / register
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return; // prevent double-submit
    setAuthError("");
    setIsAuthenticating(true);

    try {
      if (authMode === "login") {
        const res = await apiRequest<any>("/auth/login", "POST", {
          email: authEmail,
          password: authPassword
        });
        if (res && res.user) {
          localStorage.setItem("eyeware_active_customer", JSON.stringify(res.user));
          setActiveCustomer(res.user);
          localStorage.setItem("cromatic_active_customer", JSON.stringify(res.user));
          setIsAuthOpen(false);
          setAuthPassword("");
        }
      } else if (authMode === "register") {
        await apiRequest<any>("/auth/register", "POST", {
          name: authName,
          email: authEmail,
          phone: authPhone,
          password: authPassword
        });
        // Auto-login after successful registration
        const loginRes = await apiRequest<any>("/auth/login", "POST", {
          email: authEmail,
          password: authPassword
        });
        if (loginRes && loginRes.user) {
          setActiveCustomer(loginRes.user);
          localStorage.setItem("cromatic_active_customer", JSON.stringify(loginRes.user));
          setIsAuthOpen(false);
          setAuthPassword("");
          setAuthName("");
        }
      } else if (authMode === "forgot") {
        alert("Reset password request sent to your registered email.");
        setAuthMode("login");
      }
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Safe navigation wrapper: intercepts protected customer areas and prompts login if guest
  const secureNavigate = (route: string) => {
    setIsMobileMenuOpen(false);
    const activeCustomerJson = localStorage.getItem("cromatic_active_customer");
    if (!activeCustomerJson && ["account", "orders", "prescriptions", "invoices", "checkout"].includes(route)) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }
    onNavigate(route);
  };

  const navItems = [
    { key: "home", label: "Home", match: (r: string) => r === "home" },
    { key: "products", label: "Eyewear", match: (r: string) => r === "products" || r.startsWith("product") },
    { key: "account", label: "My Account", match: (r: string) => ["account", "orders", "prescriptions", "invoices"].includes(r) },
  ];

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      {/* Announcement Bar */}
      <div className="bg-foreground text-background text-center py-2.5 px-4 text-xs tracking-wide font-medium relative z-50">
        <span>Free shipping on orders above ₹3,000</span>
        <span className="hidden sm:inline mx-3 opacity-30">|</span>
        <span className="hidden sm:inline opacity-80">Easy 14-day returns</span>
      </div>

      {/* Header */}
      <header 
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/98 backdrop-blur-xl shadow-sm border-b border-border/50" 
            : "bg-background border-b border-border/30"
        }`}
      >
        <nav className="max-w-360 mx-auto px-6 lg:px-10" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <button 
              onClick={() => onNavigate("home")}
              className="relative z-10 flex items-center gap-2 cursor-pointer"
              aria-label="Cromatic Vision - Home"
            >
              <span className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">
                Cromatic<span className="font-light ml-1">Vision</span>
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(nav => (
                <button 
                  key={nav.key}
                  onClick={() => secureNavigate(nav.key)}
                  className={`px-4 py-2 text-[14px] font-medium transition-colors duration-200 rounded-full cursor-pointer ${
                    nav.match(currentRoute) 
                      ? "text-foreground bg-secondary" 
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {nav.label}
                </button>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Wishlist */}
              <button
                onClick={() => secureNavigate("account")}
                className="p-2.5 rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                aria-label="Shopping bag"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                <AnimatePresence>
                  {getTotalItems() > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {getTotalItems()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User */}
              {activeCustomer ? (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={() => secureNavigate("account")}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-foreground/70" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-foreground hidden lg:inline truncate max-w-24">
                      {activeCustomer.name.split(" ")[0]}
                    </span>
                  </button>
                  <button
                    onClick={handleCustomerLogout}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-full hover:bg-secondary/50"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthOpen(true);
                  }}
                  className="ml-1 h-10 px-5 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}

              {/* Mobile menu trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-foreground md:hidden cursor-pointer"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-background border-b border-border px-6 py-6 space-y-1 overflow-hidden"
          >
            {navItems.map((item, idx) => (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => secureNavigate(item.key)}
                className={`block w-full text-left py-3 px-3 rounded-lg text-[15px] font-medium transition-colors ${
                  item.match(currentRoute) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary viewport content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Shopping Bag</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-20 space-y-4 max-w-xs mx-auto">
                    <div className="w-14 h-14 mx-auto flex items-center justify-center bg-secondary rounded-2xl">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-base font-medium text-foreground">Your bag is empty</h4>
                    <p className="text-sm text-muted-foreground">Browse our collection and find your perfect pair.</p>
                  </div>
                ) : (
                  items.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-colors"
                    >
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h5 className="text-sm font-medium text-foreground truncate">{item.name}</h5>
                        <p className="text-sm font-semibold text-foreground">₹{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-border rounded-full">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-6 py-5 border-t border-border space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Shipping & taxes calculated at checkout</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      secureNavigate("checkout");
                    }}
                    className="w-full h-13 bg-foreground text-background text-[15px] font-medium rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10" 
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md bg-background border border-border p-8 rounded-2xl relative z-20 space-y-6 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <User className="w-5 h-5 text-foreground/70" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  {authMode === "login" && "Welcome back"}
                  {authMode === "register" && "Create your account"}
                  {authMode === "forgot" && "Reset password"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {authMode === "login" && "Sign in to access your orders, prescriptions and more."}
                  {authMode === "register" && "Join Cromatic Vision for a personalized shopping experience."}
                  {authMode === "forgot" && "We'll send you a link to reset your password."}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Phone</label>
                    <input
                      type="text"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                )}

                {authMode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-foreground block">Password</label>
                      {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => setAuthMode("forgot")}
                          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  id="btn-perform-auth"
                  className="w-full h-12 bg-foreground text-background font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-foreground/90 transition-all disabled:opacity-50 text-[15px]"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    <>
                      {authMode === "login" ? "Sign In" : authMode === "register" ? "Create Account" : "Send Reset Link"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
                {authMode === "login" ? (
                  <p>
                    New to Cromatic Vision?{" "}
                    <button
                      onClick={() => { setAuthMode("register"); setAuthError(""); }}
                      className="text-foreground font-medium hover:underline underline-offset-2 cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => { setAuthMode("login"); setAuthError(""); }}
                      className="text-foreground font-medium hover:underline underline-offset-2 cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-360 mx-auto px-6 lg:px-10 py-14 lg:py-18">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <span className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">
                Cromatic<span className="font-light ml-1">Vision</span>
              </span>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Premium eyewear for discerning individuals. Quality frames, exceptional service, crafted with precision since 2020.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Shop</h4>
              <div className="space-y-3">
                {["Eyeglasses", "Sunglasses", "Blue Light", "New Arrivals"].map(item => (
                  <button key={item} onClick={() => secureNavigate("products")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Support</h4>
              <div className="space-y-3">
                {["Track Order", "Returns", "Shipping Info", "Contact Us"].map(item => (
                  <button key={item} onClick={() => secureNavigate("account")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Company</h4>
              <div className="space-y-3">
                {["About Us", "Our Stores", "Careers", "Sustainability"].map(item => (
                  <span key={item} className="block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border">
          <div className="max-w-360 mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
            <p>© 2026 Cromatic Vision Optical. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Warranty</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
