import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Glasses,
  Lock,
  ArrowRight
} from "lucide-react";

// Import modules
import { apiRequest, removeTokens } from "./lib/api";
import AdminLayout from "./components/AdminLayout";
import DashboardModule from "./components/DashboardModule";
import ProductsModule from "./components/ProductsModule";
import CategoriesModule from "./components/CategoriesModule";
import OrdersModule from "./components/OrdersModule";
import PrescriptionsModule from "./components/PrescriptionsModule";
import InvoicesModule from "./components/InvoicesModule";
import CustomersModule from "./components/CustomersModule";
import PageTransition from "./components/PageTransition";

// Luxury Storefront
import StorefrontHomeLuxury from "./components/StorefrontHomeLuxury";

// Customer Storefront modules (secondary pages)
import StorefrontLayout from "./components/StorefrontLayout";
import StorefrontProducts from "./components/StorefrontProducts";
import StorefrontCheckout from "./components/StorefrontCheckout";
import StorefrontAccount from "./components/StorefrontAccount";
import StorefrontWishlist from "./components/StorefrontWishlist";
import StorefrontStoreLocator from "./components/StorefrontStoreLocator";

const queryClient = new QueryClient();

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Custom storefront routing states
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Determine view mode from URL path
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Initial Data loading
  useEffect(() => {
    async function loadStorefrontData() {
      try {
        const catRes: any = await apiRequest("/categories", "GET");
        setCategories(catRes || []);
      } catch (err) {
        console.error("Categories fetch failed:", err);
      }
      try {
        const prodRes: any = await apiRequest("/products?limit=100", "GET");
        setProducts(prodRes?.items || []);
      } catch (err) {
        console.error("Products fetch failed:", err);
      }
    }
    if (!isAdminRoute) {
      loadStorefrontData();
    }
  }, [isAdminRoute]);

  const [activeModule, setActiveModule] = useState("dashboard");
  const [adminName, setAdminName] = useState("System Admin");

  // Login credentials states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth checking via HttpOnly cookies
  useEffect(() => {
    apiRequest<any>("/auth/me")
      .then(data => {
        if (data?.role === "admin") {
          setIsAuthenticated(true);
          setAdminName(data?.name || "System Admin");
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return; // prevent double-submit
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const res = await apiRequest<any>("/auth/login", "POST", {
        email: loginEmail,
        password: loginPassword
      });

      if (res?.user?.role !== "admin") {
        setAuthError("Access denied. Admin credentials required.");
        return;
      }

      setIsAuthenticated(true);
      setAdminName(res.user?.name || "System Admin");
      navigate("/admin");
    } catch (err: any) {
      setAuthError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardModule />;
      case "products": return <ProductsModule />;
      case "categories": return <CategoriesModule />;
      case "orders": return <OrdersModule />;
      case "prescriptions": return <PrescriptionsModule />;
      case "invoices": return <InvoicesModule />;
      case "customers": return <CustomersModule />;
      default: return <DashboardModule />;
    }
  };

  const handleStorefrontNavigate = (route: string) => {
    setSelectedProductSlug(null);
    switch (route) {
      case "home": navigate("/"); break;
      case "products": navigate("/products"); break;
      case "checkout": navigate("/checkout"); break;
      case "wishlist": navigate("/wishlist"); break;
      case "stores": navigate("/stores"); break;
      case "account": navigate("/account"); break;
      case "orders": navigate("/account/orders"); break;
      case "prescriptions": navigate("/account/prescriptions"); break;
      case "invoices": navigate("/account/invoices"); break;
      default: navigate("/"); break;
    }
  };

  // Storefront content component based on route
  const StorefrontContent = () => (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><StorefrontHomeLuxury /></PageTransition>} />
        <Route path="/products" element={
          <PageTransition>
            <StorefrontProducts 
              categories={categories}
              products={products}
              selectedCategoryFilter={selectedCategoryFilter}
              setSelectedCategoryFilter={setSelectedCategoryFilter}
              selectedProductSlug={selectedProductSlug}
              onClearProductSlug={() => setSelectedProductSlug(null)}
              onNavigate={handleStorefrontNavigate}
              onSelectProduct={(slug) => setSelectedProductSlug(slug)}
        />
          </PageTransition>
        } />
        <Route path="/wishlist" element={
          <PageTransition>
            <StorefrontWishlist 
              onNavigate={handleStorefrontNavigate}
            />
          </PageTransition>
        } />
        <Route path="/stores" element={
          <PageTransition>
            <StorefrontStoreLocator 
              onNavigate={handleStorefrontNavigate}
            />
          </PageTransition>
        } />
        <Route path="/checkout" element={
          <PageTransition>
            <StorefrontCheckout 
              onNavigate={handleStorefrontNavigate}
            />
          </PageTransition>
        } />
        <Route path="/account/*" element={
          <PageTransition>
            <StorefrontAccount 
              initialSubTab={
                location.pathname.includes("/orders") ? "orders" :
                location.pathname.includes("/prescriptions") ? "prescriptions" :
                location.pathname.includes("/invoices") ? "invoices" : "profile"
              }
              onNavigate={handleStorefrontNavigate}
            />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">

        {/* Dynamic Views Viewport */}
        <div className="flex-1 flex flex-col">
          {!isAdminRoute ? (
            location.pathname === "/" ? (
              <StorefrontContent />
            ) : (
              <StorefrontLayout currentRoute={location.pathname === "/" ? "home" : location.pathname.slice(1)} onNavigate={handleStorefrontNavigate}>
                <StorefrontContent />
              </StorefrontLayout>
            )
          ) : (
            !isAuthenticated ? (
              /* Administrative Logins Card */
              <div className="flex-1 flex items-center justify-center p-4 min-h-[85vh]">
                <div className="w-full max-w-md bg-[#121214]/50 border border-border/60 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                  {/* Decorative glowing backdrops */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="space-y-6">
                    <div className="text-center space-y-1.5">
                      <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                        <Glasses className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight text-white font-mono">Sign in to Cromatic Vision Optical Console</h2>
                      <p className="text-xs text-zinc-500">Provide credentials to access restricted directories references.</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      {authError && (
                        <div className="bg-rose-950/40 border border-rose-900/40 p-3 rounded-lg flex items-center gap-2 text-xs text-rose-450 font-mono">
                          <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Email</label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-[#1c1c20]/50 border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 focus:outline-[#10b981]/50 focus:border-[#10b981]/70 transition-all font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Password</label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-[#1c1c20]/50 border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 focus:outline-[#10b981]/50 focus:border-[#10b981]/70 transition-all font-mono"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        id="btn-admin-login"
                        className="w-full mt-2 bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-mono transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        {isLoggingIn ? "Authorizing gateway..." : "Secure access Sign In"} <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-3 text-[11px] font-mono text-zinc-500 leading-normal">
                      <p className="font-bold text-[#22c55e] mb-1 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Authentication Notice:
                      </p>
                      You are interacting with the production backend. Real credentials are required.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AdminLayout
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                adminName={adminName}
                onLogout={async () => {
                  try {
                    await apiRequest("/auth/logout", "POST");
                  } catch (e) {}
                  setIsAuthenticated(false);
                }}
              >
                {renderModuleContent()}
              </AdminLayout>
            )
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
