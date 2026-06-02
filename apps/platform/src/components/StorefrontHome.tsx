import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Heart, 
  Award, 
  Glasses, 
  Compass, 
  Flame,
  Star,
  Zap
} from "lucide-react";
import { Product, Category } from "../types";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Aurelia Durand",
    role: "Architect & Creative Director",
    quote: "The Aero Titanium frame feels practically non-existent on my nose. Its minimalist, pure-craft structure perfectly aligns with my design sensibilities.",
    rating: 5
  },
  {
    name: "Marcus Sterling",
    role: "Visual Developer at Porsche Studio",
    quote: "The blue-light filtration coating is a game-changer. Looking at high-contrast displays for 10 hours a day used to dry out my eyes. Not anymore.",
    rating: 5
  },
  {
    name: "Yuki Tanaka",
    role: "Exhibition Curator",
    quote: "A pure aesthetic statement. The Italian acetate texture is stunning in hand, adapting seamlessly from my studio to international gallery openings.",
    rating: 5
  }
];

// Scroll-triggered section component for premium reveal animations
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StorefrontHomeProps {
  categories: Category[];
  products: Product[];
  onNavigate: (route: string) => void;
  onSelectProduct: (slug: string) => void;
  onSelectCategory: (id: number) => void;
}

export default function StorefrontHome({
  categories,
  products,
  onNavigate,
  onSelectProduct,
  onSelectCategory
}: StorefrontHomeProps) {
  
  // Hand-picked trending products to showcase as featured
  const featuredProducts = products.filter(p => p.status === "active").slice(0, 3);

  // Parallax scroll setup for hero
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="bg-surface-0 text-white min-h-screen font-body grain-overlay">
      {/* Cinematic Hero Section with Parallax */}
      <section ref={heroRef} className="relative min-h-[94vh] flex items-center justify-center overflow-hidden px-4 md:px-8 border-b border-border-subtle">
        {/* Premium ambient light orbs with animation */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-175 bg-gold/4 rounded-full blur-[200px] ambient-orb-float" />
          <div className="absolute bottom-10 right-10 w-125 h-125 bg-blue-600/3 rounded-full blur-[180px] ambient-orb" style={{ animationDelay: '2s' }} />
          <div className="absolute top-10 left-10 w-75 h-75 bg-violet-600/2.5 rounded-full blur-[140px] ambient-orb" style={{ animationDelay: '4s' }} />
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="particle" style={{ top: '20%', left: '15%' }} />
          <div className="particle" style={{ top: '60%', left: '80%' }} />
          <div className="particle" style={{ top: '40%', left: '60%' }} />
          <div className="particle" style={{ top: '75%', left: '30%' }} />
          <div className="particle" style={{ top: '30%', left: '90%' }} />
          <div className="particle" style={{ top: '85%', left: '50%' }} />
        </div>

        <motion.div style={{ opacity: heroOpacity }} className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 py-12">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-card text-xs text-zinc-300 font-mono tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>THE NEW OPTICAL SEASONS CLASSIFIED</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight font-heading leading-[1.05] max-w-xl"
            >
              Precision Optics.<br />
              <span className="text-gradient-gold-shimmer">
                Luxury Ergonomics.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed font-body font-light"
            >
              Handcrafted titanium eyewear inspired by modern geometric mechanics. Engineered for optical correction, computer shielding, and visual distinction.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button
                onClick={() => onNavigate("products")}
                className="btn-premium px-8 py-4 bg-gold text-black font-semibold rounded-full hover:bg-gold-light transition-all duration-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer glow-gold"
              >
                Browse Collection <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("prescriptions")}
                className="px-6 py-4 glass-card hover:bg-white/6 text-white font-medium rounded-full transition-all duration-300 font-mono text-xs uppercase tracking-wider cursor-pointer active:scale-[0.97] hover:border-gold/20"
              >
                Upload Prescription
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <Zap className="w-3.5 h-3.5 text-gold" />
                <span>Free Express Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>2-Year Warranty</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <Star className="w-3.5 h-3.5 text-gold" />
                <span>4.9/5 Rating</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Product Frame with enhanced depth */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: -5 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-square max-w-110 mx-auto group">
              {/* Animated glow ring behind image */}
              <div className="absolute -inset-0.5 rounded-3xl bg-linear-to-br from-gold/20 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
              
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl border border-zinc-800/60" />
              <img 
                src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=1000&auto=format&fit=crop" 
                alt="Cromatic Vision Optical Luxury Frame Hero" 
                referrerPolicy="no-referrer"
                loading="eager"
                className="w-full h-full object-cover rounded-3xl p-3 mix-blend-lighten pointer-events-none group-hover:scale-[1.03] transition-transform duration-1000 ease-out" 
              />
              
              {/* Floating product info card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute bottom-6 right-6 left-6 p-5 glass-panel-strong rounded-2xl flex items-center justify-between"
              >
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Trending Optics</p>
                  <p className="text-sm font-semibold font-heading mt-0.5">Aero Titanium Pro</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-gold font-semibold">$189.99</p>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Limited Edition</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Scroll to Explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 border border-zinc-700 rounded-full flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-2 bg-gold rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Collections / Categories Grid Section */}
      <section className="py-32 px-4 md:px-8 border-b border-border-subtle max-w-7xl mx-auto w-full">
        <RevealSection className="text-center space-y-3 mb-16">
          <p className="text-[10px] font-bold uppercase font-mono tracking-[0.25em] text-gold">EXQUISITE GENRES</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading text-white">Curated Collections</h2>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto font-light">Engineered solutions crafted precisely to perfectly resolve modern viewing challenges.</p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const fallbackUrls = [
              "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1496181130204-755241524eab?w=400&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&auto=format&fit=crop&q=80"
            ];
            const url = fallbackUrls[idx % fallbackUrls.length];

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                onClick={() => onSelectCategory(cat.id)}
                className="bg-surface-2 border border-border-subtle rounded-2xl overflow-hidden cursor-pointer group transition-all duration-400 card-shine hover:border-gold/15 hover:shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
              >
                <div className="relative h-48 overflow-hidden bg-black/40">
                  <img 
                    src={url} 
                    alt={cat.name} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000 ease-out pointer-events-none" 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full glass-panel flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <ArrowRight className="w-3.5 h-3.5 text-gold" />
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-gold transition-colors duration-300 font-heading">{cat.name}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-light">{cat.description || "Premium optics design engineered with maximum optical calibration."}</p>
                  <p className="text-[11px] font-mono text-zinc-400 pt-3 group-hover:translate-x-2 transition-transform duration-500 inline-flex items-center gap-1.5">
                    Explore Series <ArrowRight className="w-3 h-3 text-gold" />
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-32 px-4 md:px-8 border-b border-border-subtle max-w-7xl mx-auto w-full">
        <RevealSection className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-bold uppercase font-mono tracking-[0.25em] text-gold">LATEST ITERATIONS</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading text-white">Aesthetic Flagships</h2>
            <p className="text-sm text-zinc-500 font-light">Impeccable details. Surgical strength. Zero compromises.</p>
          </div>
          <button 
            onClick={() => onNavigate("products")}
            className="text-xs font-mono uppercase tracking-wider text-gold hover:text-gold-light flex items-center gap-2 cursor-pointer active:scale-[0.97] pb-1 border-b border-gold/30 hover:border-gold-light transition-all duration-300 shrink-0 self-start md:self-end hover-magnetic"
          >
            Explore Complete Range <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProducts.map((p, idx) => {
            const primaryImg = p.images?.find(img => img.is_primary)?.image_url || "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=60";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                onClick={() => onSelectProduct(p.slug)}
                className="bg-surface-2 border border-border-subtle rounded-3xl p-6 cursor-pointer group flex flex-col justify-between card-shine hover:border-gold/15 transition-all duration-400 hover:shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
              >
                <div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 mb-6 border border-border-subtle group-hover:border-gold/10 transition-colors duration-500">
                    <img 
                      src={primaryImg} 
                      alt={p.name} 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-1000 ease-out pointer-events-none" 
                    />
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {p.stock === 0 && (
                      <div className="absolute top-3 left-3 bg-red-950/80 border border-red-900/40 text-red-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded">
                        OUT OF STOCK
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">{p.category_name}</p>
                    <h3 className="text-lg font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300">{p.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-light">{p.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 mt-6 border-t border-border-subtle group-hover:border-gold/10 transition-colors duration-500">
                  <span className="text-sm font-mono text-gold font-medium">${p.price.toFixed(2)}</span>
                  <span className="text-[11px] font-mono text-zinc-400 group-hover:text-gold group-hover:translate-x-1.5 transition-all duration-500 flex items-center gap-1">
                    Configure Optics <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Embedded Lens Technology Section (Porsche & Zeiss aesthetics) */}
      <section className="bg-linear-to-b from-[#0c0c0c] to-surface-0 py-32 border-b border-border-subtle relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 right-0 w-125 h-125 bg-blue-600/2 rounded-full blur-[200px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <RevealSection className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800/60 aspect-video lg:aspect-square bg-zinc-950 flex items-center justify-center p-8 group">
              {/* Decorative concentric structural wire loops with animation */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-zinc-900/60 rounded-full scale-75"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-blue-500/10 rounded-full scale-50"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-gold/5 rounded-full scale-[0.35]"
              />
              <img 
                src="https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=1000&auto=format&fit=crop" 
                alt="Zeiss Inspired Lens Coatings" 
                loading="lazy"
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-cover rounded-2xl opacity-80 mix-blend-screen pointer-events-none group-hover:opacity-90 transition-opacity duration-700" 
              />
            </div>
          </RevealSection>

          <RevealSection delay={0.2} className="lg:col-span-6 space-y-8 text-left">
            <span className="text-[10px] font-bold font-mono tracking-[0.25em] text-gold uppercase">LABORATORY FOCUS</span>
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight text-white leading-tight">
              Molecular Physical Shielding
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Every pair of Cromatic Vision Optical lenses undergoes rigorous ion-bombardment coating cycles inside clean-room chambers. We layer protective barriers to repel dust, filter high-intensity workstation radiation, and resist impact.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {[
                { icon: Cpu, title: "BlueShield v3", desc: "Blocks high-energy visual wavelengths emitted by screens, maintaining pure color balance." },
                { icon: Layers, title: "Multilayer AR", desc: "Eliminates 99.7% of ambient glare and backplane reflections for crystal-clear visual acuity." },
                { icon: ShieldCheck, title: "Oleophobic Protection", desc: "Repels moisture and facial lipid smudges, making cleaning effortless." },
                { icon: Compass, title: "Surgical Titanium", desc: "Surgical-grade frame alloys characterized by absolute shape-memory and spring resilience." }
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className="space-y-2 group/item"
                >
                  <div className="flex items-center gap-2 text-white">
                    <item.icon className="w-5 h-5 text-gold shrink-0 group-hover/item:scale-110 transition-transform duration-300" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">{item.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Why Choose Cromatic Vision Optical / Core Values section */}
      <section className="py-32 px-4 md:px-8 border-b border-border-subtle max-w-7xl mx-auto w-full">
        <RevealSection className="text-center space-y-3 mb-16">
          <p className="text-[10px] font-bold uppercase font-mono tracking-[0.25em] text-gold">AESTHETIC PILLARS</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading text-white">The Engineering Protocol</h2>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto font-light">Discover the foundational practices that elevate Cromatic Vision Optical beyond standard commercial eyewear.</p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Award, title: "Perfect Custom Fitting", desc: "We precisely calibrate each dynamic hinge temple, allowing the frames to securely flex and conform to any face, eliminating painful structural friction." },
            { icon: Glasses, title: "Authentic Optometrist Approval", desc: "Our clinical experts audit your prescription sheets directly to custom cut each focal lens index, certifying perfect clarity before delivery." },
            { icon: Flame, title: "Guaranteed Durability", desc: "We stand behind our production quality. Every titanium structural pivot and acetate frame incorporates scratch-mitigating warranties." }
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="bg-surface-2 border border-border-subtle p-8 rounded-3xl space-y-4 card-shine group hover:border-gold/15 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 group-hover:bg-gold/15 group-hover:scale-110 transition-all duration-500">
                <item.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300">{item.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-light">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4 md:px-8 border-b border-border-subtle max-w-5xl mx-auto w-full text-center">
        <RevealSection className="space-y-3 mb-16">
          <p className="text-[10px] font-bold uppercase font-mono tracking-[0.25em] text-gold">VOICES & CRITICS</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading text-white">Aesthetic Verdict</h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-8 rounded-2xl text-left flex flex-col justify-between group hover:border-gold/15 transition-all duration-500 hover:shadow-[0_16px_32px_rgba(0,0,0,0.3)]"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 italic leading-relaxed font-body font-light">"{test.quote}"</p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/6">
                <p className="text-xs font-semibold text-white font-body">{test.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{test.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-gold/4 rounded-full blur-[200px] pointer-events-none ambient-orb-float" />
        <div className="absolute top-1/4 right-1/4 w-75 h-75 bg-blue-500/2 rounded-full blur-[150px] pointer-events-none ambient-orb" style={{ animationDelay: '3s' }} />
        
        <RevealSection className="max-w-4xl mx-auto">
          <motion.div
            whileInView={{ scale: [0.97, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-12 md:p-20 rounded-3xl text-center space-y-8 relative z-10 chromatic-border"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight leading-tight">
              Discover Your Infinite Acuity
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-light">
              Ready to optimize your vision? Configure your single vision lens index, blue-light workstation shielding, or progressive photochromics now.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onNavigate("products")}
                className="btn-premium px-8 py-4 bg-gold text-black font-semibold rounded-full hover:bg-gold-light transition-all duration-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer glow-gold"
              >
                Browse Collections <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("prescriptions")}
                className="px-6 py-4 bg-white/3 border border-white/10 hover:bg-white/6 hover:border-gold/20 text-white font-medium rounded-full transition-all duration-300 font-mono text-xs uppercase tracking-wider cursor-pointer active:scale-[0.97]"
              >
                Configure Prescription
              </button>
            </div>
          </motion.div>
        </RevealSection>
      </section>

      {/* Premium Footer Marquee Band */}
      <section className="border-t border-border-subtle py-6 overflow-hidden">
        <div className="marquee-track">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex items-center gap-12 px-6">
              {["PRECISION OPTICS", "TITANIUM ENGINEERING", "LUXURY ERGONOMICS", "BLUE-LIGHT DEFENSE", "OPTICAL EXCELLENCE", "HANDCRAFTED QUALITY", "PREMIUM VISION"].map((text, i) => (
                <span key={`${setIdx}-${i}`} className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase whitespace-nowrap flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/30" />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
