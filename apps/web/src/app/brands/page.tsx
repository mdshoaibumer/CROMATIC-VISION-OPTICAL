"use client";

import { useState } from "react";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageHero } from "@/components/ui/page-hero";

const brands = [
  { id: 1, name: "Ray-Ban", tagline: "Timeless icons, always in style", category: "Premium", products: 450, logo: "RB" },
  { id: 2, name: "Oakley", tagline: "Performance eyewear for athletes", category: "Sports", products: 320, logo: "OA" },
  { id: 3, name: "Tom Ford", tagline: "Iconic style, unmistakably bold", category: "Luxury", products: 180, logo: "TF" },
  { id: 4, name: "Gucci", tagline: "Italian luxury since 1921", category: "Luxury", products: 220, logo: "GC" },
  { id: 5, name: "Prada", tagline: "Innovation meets tradition", category: "Luxury", products: 190, logo: "PR" },
  { id: 6, name: "Cartier", tagline: "The art of being unique", category: "Luxury", products: 95, logo: "CT" },
  { id: 7, name: "Dior", tagline: "French elegance refined", category: "Luxury", products: 210, logo: "DR" },
  { id: 8, name: "Versace", tagline: "Bold Mediterranean glamour", category: "Premium", products: 175, logo: "VS" },
  { id: 9, name: "Burberry", tagline: "British heritage reimagined", category: "Premium", products: 165, logo: "BB" },
  { id: 10, name: "Persol", tagline: "Italian craftsmanship since 1917", category: "Premium", products: 145, logo: "PO" },
  { id: 11, name: "Maui Jim", tagline: "Born from the spirit of Aloha", category: "Premium", products: 280, logo: "MJ" },
  { id: 12, name: "Silhouette", tagline: "Ultra-light, barely there", category: "Premium", products: 120, logo: "SL" },
  { id: 13, name: "Cromatic", tagline: "Your vision, our care", category: "House", products: 500, logo: "CV" },
  { id: 14, name: "Cromatic Premium", tagline: "Elevated essentials", category: "House", products: 300, logo: "CP" },
  { id: 15, name: "Calvin Klein", tagline: "Modern American style", category: "Premium", products: 195, logo: "CK" },
  { id: 16, name: "Boss", tagline: "Success starts with vision", category: "Premium", products: 210, logo: "HB" },
];

const categories = ["All", "Luxury", "Premium", "Sports", "House"];

export default function BrandsPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredBrands = activeCategory === "All" ? brands : brands.filter((b) => b.category === activeCategory);

  return (
    <div className="page-transition">
      <PageHero
        title="Our Brands"
        description="From heritage luxury houses to cutting-edge performance brands. 50+ world-class labels, one destination."
        breadcrumb="Brands"
        badge="50+ Premium Brands"
      />

      {/* Category Filter */}
      <section className="sticky top-16 lg:top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-100/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-neutral-900 text-white shadow-lg"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="py-12 lg:py-16 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredBrands.map((brand) => (
              <StaggerItem key={brand.id}>
                <Link href={`/eyeglasses?brand=${brand.name.toLowerCase().replace(" ", "-")}`} className="group block">
                  <div className="hover-card bg-white rounded-3xl p-6 border border-neutral-100/80 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 bg-linear-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center group-hover:from-amber-50 group-hover:to-amber-100 transition-all duration-300">
                        <span className="text-lg font-bold text-neutral-600 group-hover:text-amber-700 transition-colors">
                          {brand.logo}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <ArrowUpRight className="w-4 h-4 text-neutral-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">{brand.category}</span>
                      <h3 className="text-xl font-bold text-neutral-900 mt-1 mb-2">{brand.name}</h3>
                      <p className="text-sm text-neutral-500 mb-4">{brand.tagline}</p>
                    </div>
                    <p className="text-xs text-neutral-400">{brand.products} products</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
