"use client";

import Link from "next/link";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  tag: string;
  colors: string[];
  href?: string;
}

export function ProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  rating,
  reviews,
  tag,
  colors,
  href = `/eyeglasses/${id}`,
}: ProductCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-3xl overflow-hidden border border-neutral-100/80 hover:border-neutral-200 transition-all duration-500 hover-card">
        {/* Image */}
        <div className="relative aspect-4/3 bg-linear-to-br from-neutral-50 to-neutral-100/80 p-6 overflow-hidden">
          <Badge
            variant={tag === "Luxury" || tag === "Premium" ? "premium" : "secondary"}
            className="absolute top-4 left-4 z-10"
          >
            {tag}
          </Badge>

          <button
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:text-red-500 shadow-sm"
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="w-4 h-4" />
          </button>

          {/* Product Image Placeholder */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-36 h-14 bg-linear-to-r from-neutral-200/80 to-neutral-300/60 rounded-full transform group-hover:scale-110 group-hover:-rotate-2 transition-all duration-700 ease-out" />
          </div>

          {/* Quick Add */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
            <Button
              size="sm"
              className="w-full shadow-lg"
              variant="default"
              onClick={(e) => e.preventDefault()}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-xs text-neutral-400 font-medium mb-1 tracking-wide uppercase">
            {brand}
          </p>
          <h3 className="font-semibold text-neutral-900 mb-2.5 group-hover:text-amber-700 transition-colors duration-300">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-neutral-700">{rating}</span>
            <span className="text-xs text-neutral-400">({reviews})</span>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1.5 mb-3">
            {colors.map((color, i) => (
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
              ₹{price.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-sm text-neutral-400 line-through">
                ₹{originalPrice.toLocaleString()}
              </span>
            )}
            {originalPrice && (
              <Badge variant="premium" className="text-[10px] px-2 py-0.5">
                {Math.round((1 - price / originalPrice) * 100)}% OFF
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
