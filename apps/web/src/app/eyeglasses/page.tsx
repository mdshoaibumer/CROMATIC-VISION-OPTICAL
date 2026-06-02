"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Grid3X3, LayoutList, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageHero } from "@/components/ui/page-hero";
import { ProductCard } from "@/components/ui/product-card";

const products = [
  { id: 1, name: "Aria Classic", brand: "Cromatic", price: 4999, originalPrice: 7999, rating: 4.8, reviews: 234, tag: "Bestseller", colors: ["#1a1a1a", "#8B4513", "#C0C0C0"], shape: "Rectangle", material: "Acetate" },
  { id: 2, name: "Nova Titanium", brand: "Cromatic Premium", price: 8999, originalPrice: 12999, rating: 4.9, reviews: 156, tag: "New", colors: ["#FFD700", "#C0C0C0", "#1a1a1a"], shape: "Round", material: "Titanium" },
  { id: 3, name: "Zenith Pro", brand: "Ray-Ban", price: 12500, originalPrice: null, rating: 4.7, reviews: 89, tag: "Premium", colors: ["#1a1a1a", "#4A0E0E"], shape: "Aviator", material: "Metal" },
  { id: 4, name: "Eclipse Half-Rim", brand: "Tom Ford", price: 18900, originalPrice: 24900, rating: 4.9, reviews: 67, tag: "Luxury", colors: ["#1a1a1a", "#C0C0C0"], shape: "Square", material: "Titanium" },
  { id: 5, name: "Pulse Active", brand: "Oakley", price: 9500, originalPrice: null, rating: 4.6, reviews: 198, tag: "Sports", colors: ["#003366", "#8B0000", "#1a1a1a"], shape: "Wraparound", material: "Nylon" },
  { id: 6, name: "Harmony", brand: "Cromatic", price: 3999, originalPrice: 5999, rating: 4.7, reviews: 312, tag: "Value", colors: ["#8B4513", "#1a1a1a", "#DAA520"], shape: "Cat Eye", material: "Acetate" },
  { id: 7, name: "Vogue Elite", brand: "Gucci", price: 28500, originalPrice: null, rating: 5.0, reviews: 45, tag: "Luxury", colors: ["#1a1a1a", "#8B0000"], shape: "Oval", material: "Acetate" },
  { id: 8, name: "Drift Lite", brand: "Cromatic", price: 2999, originalPrice: 4499, rating: 4.5, reviews: 567, tag: "Bestseller", colors: ["#C0C0C0", "#1a1a1a", "#003366"], shape: "Rectangle", material: "Metal" },
];

const filters = {
  shape: ["Rectangle", "Round", "Aviator", "Square", "Cat Eye", "Oval", "Wraparound"],
  material: ["Acetate", "Metal", "Titanium", "Nylon", "TR-90"],
  gender: ["Men", "Women", "Unisex", "Kids"],
  price: ["Under ₹3000", "₹3000 - ₹7000", "₹7000 - ₹15000", "Above ₹15000"],
};

export default function EyeglassesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  return (
    <div className="page-transition">
      <PageHero
        title="Eyeglasses"
        description="Discover frames that blend premium craftsmanship with modern design. Find your perfect pair from 2000+ styles."
        breadcrumb="Eyeglasses"
        badge="2000+ Premium Styles"
      />

      {/* Main Content */}
      <section className="py-10 lg:py-14 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-between mb-8 bg-white rounded-2xl p-4 shadow-sm border border-neutral-100/80"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
              <span className="text-sm text-neutral-500 hidden sm:block">
                Showing <strong className="text-neutral-900">8</strong> of 2,341 results
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 bg-neutral-100/80 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all duration-300 ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all duration-300 ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
                  aria-label="List view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-50">
                Sort by: Popular
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className={`${showFilters ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:p-0" : "hidden lg:block"} w-full lg:w-64 shrink-0`}>
              {showFilters && (
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {activeFilters.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-neutral-900">Active Filters</span>
                    <button onClick={() => setActiveFilters([])} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                      <Badge key={filter} variant="secondary" className="gap-1 cursor-pointer hover:bg-neutral-200 transition-colors" onClick={() => toggleFilter(filter)}>
                        {filter}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(filters).map(([category, options]) => (
                <div key={category} className="mb-8">
                  <h4 className="text-xs font-semibold text-neutral-900 capitalize mb-3 tracking-wide uppercase">
                    {category}
                  </h4>
                  <div className="space-y-2.5">
                    {options.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(option)}
                          onChange={() => toggleFilter(option)}
                          className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 transition-colors"
                        />
                        <span className="text-sm text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <StaggerContainer className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard {...product} href={`/eyeglasses/${product.id}`} />
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Load More */}
              <div className="text-center mt-14">
                <Button variant="outline" size="lg">
                  Load More Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
