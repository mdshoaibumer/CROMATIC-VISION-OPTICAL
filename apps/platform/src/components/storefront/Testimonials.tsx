import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    content: "The quality is exceptional. Every detail has been considered, from the weight of the frames to the precision of the hinges. I've never felt this confident in my glasses.",
    author: "Sarah M.",
    title: "Product Designer at Figma",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=90",
    rating: 5,
    product: "Aviator Classic"
  },
  {
    id: 2,
    content: "Finally found frames that are both stylish and comfortable for all-day wear. The virtual try-on made the decision easy — no returns needed.",
    author: "James C.",
    title: "Founder, Nimbus Labs",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=90",
    rating: 5,
    product: "Wayfarer Modern"
  },
  {
    id: 3,
    content: "Outstanding craftsmanship and customer service. They helped me find the perfect fit for my face shape. The attention to detail is unmatched.",
    author: "Emma R.",
    title: "Photographer & Creative Director",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=90",
    rating: 5,
    product: "Round Heritage"
  }
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  const current = testimonials[currentIndex]

  return (
    <section ref={ref} className="section-padding bg-foreground text-background overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Quote className="w-8 h-8 text-background/20" />
              <p id="testimonials-heading" className="text-xs uppercase tracking-[0.25em] text-background/50 font-medium">
                What Our Customers Say
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <blockquote className="text-[clamp(22px,2.5vw,32px)] font-light leading-normal tracking-[-0.01em]">
                  "{current.content}"
                </blockquote>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-10 flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-background/10">
                  <img
                    src={current.image}
                    alt={current.author}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="font-medium text-[15px]">{current.author}</p>
                  <p className="text-sm text-background/50">{current.title}</p>
                  <p className="text-xs text-background/40 mt-0.5">Purchased: {current.product}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-12">
              <button
                onClick={prev}
                className="w-12 h-12 flex items-center justify-center border border-background/20 rounded-full hover:bg-background hover:text-foreground transition-all duration-300"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={next}
                className="w-12 h-12 flex items-center justify-center border border-background/20 rounded-full hover:bg-background hover:text-foreground transition-all duration-300"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <span className="ml-4 text-sm text-background/40 tabular-nums">
                {currentIndex + 1} / {testimonials.length}
              </span>
            </div>
          </motion.div>

          {/* Right side - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "50K+", label: "Happy customers" },
                { value: "4.9", label: "Average rating" },
                { value: "98%", label: "Would recommend" },
                { value: "2K+", label: "5-star reviews" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="p-6 border border-background/10 rounded-xl"
                >
                  <p className="text-3xl lg:text-4xl font-light tracking-tight">{stat.value}</p>
                  <p className="text-sm text-background/50 mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
