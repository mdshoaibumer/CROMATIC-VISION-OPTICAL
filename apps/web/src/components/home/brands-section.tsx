"use client";

import { motion } from "framer-motion";

import Link from "next/link";
import { FadeInSection } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const brands = [
  { name: "Ray-Ban", logo: "RB" },
  { name: "Oakley", logo: "OA" },
  { name: "Tom Ford", logo: "TF" },
  { name: "Gucci", logo: "GC" },
  { name: "Prada", logo: "PR" },
  { name: "Cartier", logo: "CT" },
  { name: "Dior", logo: "DR" },
  { name: "Versace", logo: "VS" },
];

export function BrandsSection() {
  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden relative">
      {/* Subtle decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-linear-to-r from-amber-50/30 via-transparent to-amber-50/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-amber-600 tracking-[0.2em] uppercase mb-4">
              World-Class Brands
            </p>
            <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-5 font-(family-name:--font-playfair)">
              50+ Premium Brands
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              From timeless luxury houses to cutting-edge performance brands, all under one roof.
            </p>
          </div>
        </FadeInSection>

        {/* Brand Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-14">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/brands#${brand.name.toLowerCase().replace(" ", "-")}`}
                className="group flex flex-col items-center justify-center aspect-square bg-neutral-50/80 rounded-2xl border border-neutral-100 hover:border-amber-200/60 hover:bg-amber-50/40 transition-all duration-500 hover-card"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-3 group-hover:shadow-md transition-all duration-300 border border-neutral-100">
                  <span className="text-sm font-bold text-neutral-500 group-hover:text-amber-700 transition-colors duration-300">
                    {brand.logo}
                  </span>
                </div>
                <span className="text-xs font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors duration-300">
                  {brand.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/brands">
              View All Brands
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
