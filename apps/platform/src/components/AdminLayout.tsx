import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Glasses,
  Tags,
  ShoppingBag,
  FileText,
  Receipt,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  CheckCircle,
  Eye,
  Settings
} from "lucide-react";
import { removeTokens } from "../lib/api";

interface AdminLayoutProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  adminName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activeModule,
  setActiveModule,
  adminName,
  onLogout,
  children
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Glasses },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "prescriptions", label: "Prescriptions", icon: FileText },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "customers", label: "Customers", icon: Users },
  ];

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    removeTokens();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#09090b] border-r border-border/60 shrink-0">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-950/40">
              <Glasses className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-white text-base font-mono">Cromatic Vision Optical</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Management Console</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => handleModuleClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-border/60 bg-[#121214]/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-950 to-zinc-800 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-xs shrink-0 select-none">
                {adminName ? adminName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-300 truncate">{adminName || "Administrator"}</p>
                <span className="text-[9px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                  Admin
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              id="desktop-logout-btn"
              className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border/60 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-border text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
              id="mobile-menu-trigger"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick module indicator */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-zinc-100 font-medium capitalize">
                {activeModule.replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Right Header Operations */}
          <div className="flex items-center gap-3">
            {/* Indicator */}
            <div className="flex items-center gap-1.5 bg-emerald-950/35 border border-emerald-900/30 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Backend Connected</span>
            </div>

            <div className="w-px h-5 bg-border/60 hidden sm:block"></div>

            {/* Admin Display Name on Desktop */}
            <div className="hidden sm:block text-xs font-mono text-zinc-400">
              UTC: {new Date().toISOString().substring(11, 16)}
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sidebar Overlay menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark backing overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Drawer side sheet drawer container */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-72 bg-[#09090b] border-r border-border h-full flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-6 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                    <Glasses className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-bold tracking-tight text-white text-sm font-mono">Cromatic Vision Optical</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 cursor-pointer"
                  id="mobile-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleModuleClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-emerald-950/50 text-emerald-400 font-semibold"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Profile bottom area */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-300">{adminName}</p>
                  <span className="text-[10px] text-zinc-500 font-mono">System Administrator</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg font-medium text-rose-400 hover:bg-rose-950/20 flex items-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
