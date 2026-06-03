"use client";

import { useState } from "react";


import { Eye, Star, ShoppingBag, Clock, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageHero } from "@/components/ui/page-hero";

const products = [
  { id: 1, name: "Acuvue Oasys", brand: "Johnson & Johnson", price: 1899, packSize: "30 Lenses", type: "Daily", rating: 4.9, reviews: 1234, tag: "Bestseller", waterContent: "38%", oxygenPermeability: "High" },
  { id: 2, name: "Air Optix Aqua", brand: "Alcon", price: 1299, packSize: "6 Lenses", type: "Monthly", rating: 4.7, reviews: 876, tag: "Comfortable", waterContent: "33%", oxygenPermeability: "Very High" },
  { id: 3, name: "Dailies Total 1", brand: "Alcon", price: 2499, packSize: "30 Lenses", type: "Daily", rating: 4.8, reviews: 567, tag: "Premium", waterContent: "33%", oxygenPermeability: "Ultra High" },
  { id: 4, name: "FreshLook Colorblends", brand: "Alcon", price: 1599, packSize: "2 Lenses", type: "Colored", rating: 4.6, reviews: 2345, tag: "Popular", waterContent: "55%", oxygenPermeability: "Medium" },
  { id: 5, name: "Biofinity", brand: "CooperVision", price: 1099, packSize: "6 Lenses", type: "Monthly", rating: 4.8, reviews: 432, tag: "Value", waterContent: "48%", oxygenPermeability: "High" },
  { id: 6, name: "Soflens Toric", brand: "Bausch + Lomb", price: 1799, packSize: "6 Lenses", type: "Toric", rating: 4.7, reviews: 234, tag: "Astigmatism", waterContent: "66%", oxygenPermeability: "Medium" },
];

const types = ["All", "Daily", "Monthly", "Colored", "Toric", "Multifocal"];

export default function ContactLensesPage() {
  const [activeType, setActiveType] = useState("All");

  const filteredProducts = activeType === "All" ? products : products.filter((p) => p.type === activeType);

  return (
    <div className="page-transition">
      <PageHero
        title="Contact Lenses"
        description="Premium contact lenses for every lifestyle. Crystal clear vision without compromising comfort."
        breadcrumb="Contact Lenses"
        gradient="from-teal-900 via-emerald-900 to-neutral-900"
        accentColor="text-emerald-400"
        badge="Free Consultation"
      />

      {/* Type Tabs */}
      <section className="sticky top-16 lg:top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-100/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeType === type
                    ? "bg-neutral-900 text-white shadow-lg"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-12 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              <div className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-neutral-100/80">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">Free Consultation</p>
                  <p className="text-xs text-neutral-500">Expert fitting guidance</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-neutral-100/80">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">Quick Delivery</p>
                  <p className="text-xs text-neutral-500">Same day dispatch</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-neutral-100/80">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">Moisture Rich</p>
                  <p className="text-xs text-neutral-500">All-day comfort lenses</p>
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Product Grid */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <StaggerItem key={product.id}>
                <div className="hover-card bg-white rounded-3xl overflow-hidden border border-neutral-100/80 group">
                  <div className="relative bg-linear-to-br from-emerald-50/50 to-teal-50/50 p-8 flex items-center justify-center h-48">
                    <Badge variant={product.tag === "Premium" ? "premium" : "secondary"} className="absolute top-4 left-4">
                      {product.tag}
                    </Badge>
                    <div className="w-24 h-24 bg-linear-to-br from-emerald-200 to-teal-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Eye className="w-10 h-10 text-teal-600" />
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-neutral-500 font-medium mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-neutral-900 mb-2">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-neutral-700">{product.rating}</span>
                      <span className="text-xs text-neutral-400">({product.reviews})</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4 text-xs">
                      <span className="px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">{product.type}</span>
                      <span className="px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">{product.packSize}</span>
                      <span className="px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">Water: {product.waterContent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-neutral-900">₹{product.price.toLocaleString()}</span>
                      <Button size="sm" variant="default">
                        <ShoppingBag className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
