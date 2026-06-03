"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageHero } from "@/components/ui/page-hero";
import { ProductCard } from "@/components/ui/product-card";

const products = [
  { id: 1, name: "Aviator Classic", brand: "Ray-Ban", price: 12500, originalPrice: null, rating: 4.9, reviews: 456, tag: "Iconic", colors: ["#1a1a1a", "#FFD700", "#C0C0C0"] },
  { id: 2, name: "Wayfarer Original", brand: "Ray-Ban", price: 9890, originalPrice: 11500, rating: 4.8, reviews: 678, tag: "Bestseller", colors: ["#1a1a1a", "#8B4513"] },
  { id: 3, name: "Polarized Sport", brand: "Oakley", price: 15900, originalPrice: null, rating: 4.7, reviews: 234, tag: "Sports", colors: ["#1a1a1a", "#003366", "#8B0000"] },
  { id: 4, name: "Oversized Glam", brand: "Gucci", price: 28900, originalPrice: null, rating: 5.0, reviews: 89, tag: "Luxury", colors: ["#1a1a1a", "#8B0000", "#FFD700"] },
  { id: 5, name: "Cat Eye Diva", brand: "Tom Ford", price: 32500, originalPrice: 38000, rating: 4.9, reviews: 45, tag: "Luxury", colors: ["#1a1a1a", "#4A0E0E"] },
  { id: 6, name: "Street Pulse", brand: "Cromatic", price: 3999, originalPrice: 5999, rating: 4.6, reviews: 890, tag: "Value", colors: ["#003366", "#1a1a1a", "#8B4513"] },
];

const filters = {
  style: ["Aviator", "Wayfarer", "Cat Eye", "Round", "Square", "Oversized", "Sport"],
  lens: ["Polarized", "Gradient", "Mirror", "Photochromic"],
  gender: ["Men", "Women", "Unisex"],
  price: ["Under ₹5000", "₹5000 - ₹15000", "₹15000 - ₹30000", "Above ₹30000"],
};

export default function SunglassesPage() {
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
        title="Sunglasses"
        description="Shield your eyes in style. From timeless aviators to bold oversized frames, find your perfect shade."
        breadcrumb="Sunglasses"
        gradient="from-amber-900 via-neutral-900 to-neutral-950"
        badge="UV400 Protection"
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
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
              <span className="text-sm text-neutral-500 hidden sm:block">
                Showing <strong className="text-neutral-900">6</strong> of 1,567 results
              </span>
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-50">
              Sort by: Popular
              <ChevronDown className="w-4 h-4" />
            </button>
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

              {Object.entries(filters).map(([category, options]) => (
                <div key={category} className="mb-8">
                  <h4 className="text-xs font-semibold text-neutral-900 capitalize mb-3 tracking-wide uppercase">{category}</h4>
                  <div className="space-y-2.5">
                    {options.map((option) => (
                      <label key={option} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(option)}
                          onChange={() => toggleFilter(option)}
                          className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 transition-colors"
                        />
                        <span className="text-sm text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard {...product} href={`/sunglasses/${product.id}`} />
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <div className="text-center mt-14">
                <Button variant="outline" size="lg">Load More Products</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
