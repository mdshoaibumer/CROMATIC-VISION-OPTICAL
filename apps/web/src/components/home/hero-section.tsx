"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024 || "ontouchstart" in window);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Disable parallax on mobile/touch devices and when user prefers reduced motion
  const shouldAnimate = !isMobile && !prefersReducedMotion;
  const y = useTransform(scrollYProgress, [0, 1], shouldAnimate ? [0, 150] : [0, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], shouldAnimate ? [1, 0] : [1, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], shouldAnimate ? [1, 0.95] : [1, 1]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#fafafa]"
    >
      {/* Premium Mesh Gradient Background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-40%] right-[-20%] w-[80%] h-[80%] bg-linear-to-br from-amber-100/20 via-transparent to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-30%] left-[-20%] w-[60%] h-[60%] bg-linear-to-tr from-neutral-100/40 via-transparent to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "48px 48px" }} />

      <motion.div style={{ y, opacity, scale }} className="relative w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center min-h-[85vh]">
            {/* Left Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-full text-sm text-neutral-600 font-medium mb-8 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 font-semibold">New</span>
                <span className="w-px h-3.5 bg-neutral-300" />
                2026 Collection Available
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold text-neutral-900 leading-[1.08] tracking-tight mb-6 font-(family-name:--font-playfair)"
              >
                See the World
                <br />
                <span className="relative inline-block">
                  <span className="text-gradient">Differently</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                    className="absolute -bottom-1 left-0 right-0 h-0.75 bg-linear-to-r from-amber-600/60 to-amber-400/30 origin-left rounded-full"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-lg lg:text-xl text-neutral-500 mb-10 max-w-xl leading-relaxed"
              >
                Premium eyewear crafted for those who appreciate exceptional quality.
                Experience perfect vision with frames that define your style.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                className="flex flex-wrap items-center gap-4"
              >
                <Button size="lg" variant="primary" asChild>
                  <Link href="/eyeglasses">
                    Explore Collection
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2.5 group">
                  <span className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center group-hover:bg-amber-600 transition-colors duration-300">
                    <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                  </span>
                  Watch Story
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="flex items-center gap-8 mt-14 pt-8 border-t border-neutral-200/60"
              >
                {[
                  { value: "50+", label: "Premium Brands" },
                  { value: "100K+", label: "Happy Customers" },
                  { value: "4.9★", label: "Customer Rating" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                  >
                    <p className="text-2xl lg:text-3xl font-bold text-neutral-900">{stat.value}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right - Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-4/5 max-w-lg mx-auto">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-linear-to-b from-amber-100/20 to-transparent rounded-[3rem] blur-3xl scale-110" />

                {/* Main Glassmorphism Card */}
                <div className="absolute inset-6 glass-card rounded-[2.5rem] overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-neutral-50/80 to-white/40" />
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-48 h-28 mx-auto mb-6 bg-linear-to-r from-neutral-200 to-neutral-300 rounded-4xl opacity-40 blur-sm" />
                      <div className="w-40 h-24 mx-auto -mt-20 bg-linear-to-r from-neutral-300/80 to-neutral-400/60 rounded-full" />
                      <p className="text-sm text-neutral-400 font-medium mt-8 tracking-wide">Premium Eyewear</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card - Free Eye Test */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-8 -left-6 z-20"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-premium border border-neutral-100/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-600 text-base">✓</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">Free Eye Test</p>
                        <p className="text-[10px] text-neutral-400">At all 50+ stores</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Card - Rating */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-12 -right-6 z-20"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-premium border border-neutral-100/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <span className="text-amber-600 text-base">★</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">4.9/5 Rating</p>
                        <p className="text-[10px] text-neutral-400">100K+ reviews</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Decorative circles */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-neutral-200/30 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-neutral-200/15 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-neutral-300 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
