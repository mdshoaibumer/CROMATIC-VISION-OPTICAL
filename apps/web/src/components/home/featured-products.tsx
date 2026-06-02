"use client";

import { motion } from "framer-motion";

import Link from "next/link";
import { Heart, ShoppingBag, Star, ArrowRight } from "lucide-react";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const products = [
  {
    id: 1,
    name: "Aria Classic",
    brand: "Cromatic",
    price: 4999,
    originalPrice: 7999,
    image: null,
    rating: 4.8,
    reviews: 234,
    tag: "Bestseller",
    colors: ["#1a1a1a", "#8B4513", "#C0C0C0"],
  },
  {
    id: 2,
    name: "Nova Titanium",
    brand: "Cromatic Premium",
    price: 8999,
    originalPrice: 12999,
    image: null,
    rating: 4.9,
    reviews: 156,
    tag: "New",
    colors: ["#FFD700", "#C0C0C0", "#1a1a1a"],
  },
  {
    id: 3,
    name: "Zenith Pro",
    brand: "Ray-Ban",
    price: 12500,
    originalPrice: null,
    image: null,
    rating: 4.7,
    reviews: 89,
    tag: "Premium",
    colors: ["#1a1a1a", "#4A0E0E"],
  },
  {
    id: 4,
    name: "Pulse Sport",
    brand: "Oakley",
    price: 15900,
    originalPrice: 18900,
    image: null,
    rating: 4.9,
    reviews: 312,
    tag: "Trending",
    colors: ["#1a1a1a", "#003366", "#8B0000"],
  },
];

export function FeaturedProducts() {
  return (
    <section className="py-24 lg:py-32 bg-[#fafafa] relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <FadeInSection>
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-sm font-medium text-amber-600 tracking-[0.2em] uppercase mb-4">
                Curated for You
              </p>
              <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight font-(family-name:--font-playfair)">
                Featured Collection
              </h2>
            </div>
            <Link
              href="/eyeglasses"
              className="hidden sm:inline-flex items-center gap-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-all duration-300 group"
            >
              View All
              <span className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center group-hover:bg-amber-600 transition-colors duration-300">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <div className="group bg-white rounded-3xl overflow-hidden border border-neutral-100/80 hover:border-neutral-200 transition-all duration-500 hover-card">
                {/* Image */}
                <div className="relative aspect-4/3 bg-linear-to-br from-neutral-50 to-neutral-100/80 p-6 overflow-hidden">
                  <Badge
                    variant={product.tag === "Premium" ? "premium" : "secondary"}
                    className="absolute top-4 left-4 z-10"
                  >
                    {product.tag}
                  </Badge>

                  {/* Wishlist */}
                  <button className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:text-red-500 shadow-sm" aria-label="Add to wishlist">
                    <Heart className="w-4 h-4" />
                  </button>

                  {/* Product Image Placeholder */}
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-36 h-14 bg-linear-to-r from-neutral-200/80 to-neutral-300/60 rounded-full transform group-hover:scale-110 group-hover:-rotate-2 transition-all duration-700 ease-out" />
                  </div>

                  {/* Quick Add */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                    <Button size="sm" className="w-full shadow-lg" variant="default">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Quick Add
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="text-xs text-neutral-400 font-medium mb-1 tracking-wide uppercase">
                    {product.brand}
                  </p>
                  <h3 className="font-semibold text-neutral-900 mb-2.5 group-hover:text-amber-700 transition-colors duration-300">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-neutral-700">
                      {product.rating}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({product.reviews})
                    </span>
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {product.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-1 ring-neutral-200/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-neutral-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                    {product.originalPrice && (
                      <Badge variant="premium" className="text-[10px] px-2 py-0.5">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
