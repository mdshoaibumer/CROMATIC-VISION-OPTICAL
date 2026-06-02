"use client";

import Link from "next/link";

import { ArrowUpRight, Glasses, Sun, Eye, Monitor } from "lucide-react";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/ui/animations";

const categories = [
  {
    name: "Eyeglasses",
    description: "Precision-crafted prescription frames",
    href: "/eyeglasses",
    icon: Glasses,
    gradient: "from-blue-50/80 to-indigo-50/50",
    hoverGradient: "group-hover:from-blue-100/80 group-hover:to-indigo-100/50",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    count: "2000+",
    countLabel: "Styles",
  },
  {
    name: "Sunglasses",
    description: "UV protection meets luxury design",
    href: "/sunglasses",
    icon: Sun,
    gradient: "from-amber-50/80 to-orange-50/50",
    hoverGradient: "group-hover:from-amber-100/80 group-hover:to-orange-100/50",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    count: "1500+",
    countLabel: "Styles",
  },
  {
    name: "Contact Lenses",
    description: "Daily, monthly & colored options",
    href: "/contact-lenses",
    icon: Eye,
    gradient: "from-emerald-50/80 to-teal-50/50",
    hoverGradient: "group-hover:from-emerald-100/80 group-hover:to-teal-100/50",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    count: "500+",
    countLabel: "Options",
  },
  {
    name: "Computer Glasses",
    description: "Blue light protection for screens",
    href: "/eyeglasses?type=computer",
    icon: Monitor,
    gradient: "from-violet-50/80 to-purple-50/50",
    hoverGradient: "group-hover:from-violet-100/80 group-hover:to-purple-100/50",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    count: "800+",
    countLabel: "Styles",
  },
];

export function CategoriesSection() {
  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-150 bg-linear-to-b from-neutral-50 to-transparent rounded-full blur-3xl opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-amber-600 tracking-[0.2em] uppercase mb-4">
              Shop by Category
            </p>
            <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight font-(family-name:--font-playfair)">
              Find Your Perfect Pair
            </h2>
            <p className="text-neutral-500 mt-4 max-w-lg mx-auto">
              Explore our curated collections designed for every lifestyle and occasion
            </p>
          </div>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <StaggerItem key={category.name}>
              <Link href={category.href} className="group block">
                <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${category.gradient} ${category.hoverGradient} p-7 h-80 flex flex-col justify-between transition-all duration-500 hover-card border border-white/60`}>
                  {/* Icon */}
                  <div className={`w-14 h-14 ${category.iconBg} rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <category.icon className={`w-7 h-7 ${category.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-2xl font-bold text-neutral-900">{category.count}</span>
                      <span className="text-xs text-neutral-500">{category.countLabel}</span>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1.5">
                      {category.name}
                    </h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2 shadow-sm">
                    <ArrowUpRight className="w-4 h-4 text-neutral-900" />
                  </div>

                  {/* Decorative corner blur */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
