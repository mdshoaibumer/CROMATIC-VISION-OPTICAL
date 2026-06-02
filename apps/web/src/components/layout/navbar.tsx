"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  MapPin,
  Phone,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Eyeglasses",
    href: "/eyeglasses",
    submenu: [
      { name: "Men", href: "/eyeglasses?gender=men" },
      { name: "Women", href: "/eyeglasses?gender=women" },
      { name: "Kids", href: "/eyeglasses?gender=kids" },
      { name: "Rimless", href: "/eyeglasses?style=rimless" },
      { name: "Half Rim", href: "/eyeglasses?style=half-rim" },
      { name: "Full Rim", href: "/eyeglasses?style=full-rim" },
    ],
  },
  {
    name: "Sunglasses",
    href: "/sunglasses",
    submenu: [
      { name: "Men", href: "/sunglasses?gender=men" },
      { name: "Women", href: "/sunglasses?gender=women" },
      { name: "Polarized", href: "/sunglasses?type=polarized" },
      { name: "Aviator", href: "/sunglasses?shape=aviator" },
      { name: "Wayfarer", href: "/sunglasses?shape=wayfarer" },
      { name: "Sports", href: "/sunglasses?type=sports" },
    ],
  },
  {
    name: "Contact Lenses",
    href: "/contact-lenses",
    submenu: [
      { name: "Daily", href: "/contact-lenses?type=daily" },
      { name: "Monthly", href: "/contact-lenses?type=monthly" },
      { name: "Colored", href: "/contact-lenses?type=colored" },
      { name: "Toric", href: "/contact-lenses?type=toric" },
    ],
  },
  { name: "Eye Test", href: "/eye-test" },
  { name: "Brands", href: "/brands" },
  { name: "Store Locator", href: "/store-locator" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <Link href="/store-locator" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <MapPin className="w-3 h-3" />
              Find a Store
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Phone className="w-3 h-3" />
              1800-123-4567
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-amber-400 font-medium">Free Eye Test at All Stores</span>
            <span className="text-neutral-400">|</span>
            <span>Free Shipping on Orders ₹999+</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <motion.header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          isScrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-neutral-900/5 border-b border-neutral-100"
            : "bg-white"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neutral-900 to-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight text-neutral-900">
                  Cromatic Vision
                </h1>
                <p className="text-[10px] text-neutral-500 -mt-0.5 tracking-widest uppercase">
                  Optical
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative group"
                  onMouseEnter={() => setActiveSubmenu(item.name)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <Link
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-50"
                  >
                    {item.name}
                  </Link>

                  {/* Submenu */}
                  {item.submenu && (
                    <AnimatePresence>
                      {activeSubmenu === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-neutral-900/10 border border-neutral-100 p-3 z-50"
                        >
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="block px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all duration-200"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Search">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Account">
                <User className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-70 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        className="block px-4 py-3 text-base font-medium text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                      {item.submenu && (
                        <div className="pl-6 space-y-0.5">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="block px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
                <div className="mt-8 pt-8 border-t border-neutral-100 space-y-4">
                  <Link
                    href="/about"
                    className="block text-sm text-neutral-600 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/blog"
                    className="block text-sm text-neutral-600 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href="/contact"
                    className="block text-sm text-neutral-600 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
