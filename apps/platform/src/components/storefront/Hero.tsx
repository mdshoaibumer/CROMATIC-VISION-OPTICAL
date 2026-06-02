import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"

const heroSlides = [
  {
    tag: "New Collection 2026",
    title: "Precision",
    subtitle: "Engineered",
    description: "Handcrafted frames designed with aerospace-grade titanium for lasting comfort and timeless elegance.",
    cta: "Shop Collection",
    ctaLink: "/products",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1920&h=1080&fit=crop&q=90",
    accent: "From ₹2,999"
  },
  {
    tag: "Summer Essentials",
    title: "Summer",
    subtitle: "2026",
    description: "Polarized lenses that protect your vision. Designs that inspire confidence.",
    cta: "Explore Sunglasses",
    ctaLink: "/products?category=sunglasses",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1920&h=1080&fit=crop&q=90",
    accent: "UV400 Protection"
  },
  {
    tag: "Limited Edition",
    title: "Artisan",
    subtitle: "Series",
    description: "Hand-finished acetate frames in exclusive colorways. Only 500 pieces crafted worldwide.",
    cta: "View Collection",
    ctaLink: "/products",
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1920&h=1080&fit=crop&q=90",
    accent: "Limited to 500"
  }
]

const contentVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    setProgress(0)
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setProgress(0)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const duration = 7000
    const interval = 50
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide()
          return 0
        }
        return prev + step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isPaused, nextSlide, currentSlide])

  const slide = heroSlides[currentSlide]

  return (
    <section 
      className="relative h-svh min-h-162.5 max-h-250 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero carousel"
      role="region"
    >
      {/* Background Images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt=""
            className="w-full h-full object-cover"
            loading={currentSlide === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-linear-to-r from-background/98 via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-linear-to-t from-background/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full max-w-360 mx-auto px-6 lg:px-10 flex items-center">
        <div className="max-w-2xl pt-18">
          <AnimatePresence mode="wait">
            <motion.div key={currentSlide}>
              {/* Tag */}
              <motion.div
                custom={0}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="inline-flex items-center gap-3 mb-8"
              >
                <span className="w-8 h-px bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
                  {slide.tag}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                custom={0.1}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-[clamp(3rem,8vw,6rem)] font-light leading-[0.92] tracking-[-0.04em] text-foreground"
              >
                {slide.title}
                <br />
                <span className="font-serif italic font-normal">{slide.subtitle}</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                custom={0.2}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-6 md:mt-8 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed"
              >
                {slide.description}
              </motion.p>

              {/* CTA Group */}
              <motion.div
                custom={0.35}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-8 md:mt-10 flex flex-wrap items-center gap-3 md:gap-5"
              >
                <a 
                  href={slide.ctaLink}
                  className="group inline-flex items-center gap-3 h-12 md:h-14 px-6 md:px-8 bg-foreground text-background text-sm md:text-[15px] font-medium hover:bg-foreground/90 transition-all duration-300 hover:shadow-xl"
                >
                  {slide.cta}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                
                <span className="text-sm text-muted-foreground font-medium tracking-wide">
                  {slide.accent}
                </span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="h-0.5 bg-border/30">
          <div 
            className="h-full bg-foreground/60 transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-360 mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-sm text-muted-foreground tabular-nums font-medium">
              <span className="text-foreground">{String(currentSlide + 1).padStart(2, '0')}</span>
              {" / "}
              {String(heroSlides.length).padStart(2, '0')}
            </span>
            
            <div className="hidden sm:flex gap-3">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className="group relative h-8 flex items-center"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === currentSlide ? "true" : undefined}
                >
                  <span className={`block h-0.5 transition-all duration-500 ${
                    i === currentSlide ? "w-16 bg-foreground" : "w-8 bg-foreground/20 group-hover:bg-foreground/40"
                  }`} />
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="hidden md:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest"
          >
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ↓
            </motion.span>
            Scroll to explore
          </motion.div>
        </div>
      </div>
    </section>
  )
}
