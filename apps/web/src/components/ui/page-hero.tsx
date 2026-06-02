"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PageHeroProps {
  title: string;
  description: string;
  breadcrumb: string;
  gradient?: string;
  accentColor?: string;
  badge?: string;
}

export function PageHero({
  title,
  description,
  breadcrumb,
  gradient = "from-neutral-900 via-neutral-800 to-neutral-900",
  accentColor = "text-amber-400",
  badge,
}: PageHeroProps) {
  return (
    <section className={`relative bg-linear-to-br ${gradient} text-white py-20 lg:py-28 overflow-hidden`}>
      {/* Premium background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-0 right-0 w-125 h-125 bg-linear-to-bl from-white/3 to-transparent rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-linear-to-tr from-white/2 to-transparent rounded-full translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/6 border border-white/10 rounded-full text-sm font-medium mb-6"
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${accentColor}`} />
              <span className="text-white/80">{badge}</span>
            </motion.div>
          )}
          <h1 className="text-4xl lg:text-6xl font-bold mb-5 tracking-tight font-(family-name:--font-playfair)">
            {title}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-white/40">
            <Link href="/" className="hover:text-white/80 transition-colors duration-300">Home</Link>
            <span className="text-white/20">/</span>
            <span className={accentColor}>{breadcrumb}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
