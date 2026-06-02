import { useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { ArrowRight } from "lucide-react"

const collections = [
  {
    title: "The Artisan",
    subtitle: "Collection",
    description: "Handcrafted titanium frames, designed in collaboration with master artisans. Limited edition pieces that blend heritage craftsmanship with modern aesthetics.",
    image: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=1800&h=800&fit=crop&q=90",
    cta: "Explore Collection",
    label: "Featured Collection"
  },
  {
    title: "Blue Light",
    subtitle: "Shield",
    description: "Protect your eyes from harmful blue light with our advanced lens technology. Perfect for professionals who spend hours in front of screens.",
    image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1800&h=800&fit=crop&q=90",
    cta: "Shop Blue Light",
    label: "Digital Wellness"
  }
]

export function FeaturedCollections() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"])

  return (
    <section ref={ref} className="section-padding" aria-labelledby="featured-heading">
      <div className="max-w-360 mx-auto px-6 lg:px-10 space-y-6">
        {collections.map((collection, i) => (
          <motion.div
            key={collection.title}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-video lg:aspect-21/9 overflow-hidden rounded-xl group"
          >
            <motion.div className="absolute inset-0 scale-[1.1]" style={{ y: imageY }}>
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </motion.div>
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-transparent" />
            
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-xl px-8 lg:px-16">
                <motion.p 
                  className="text-xs uppercase tracking-[0.2em] text-white/60 mb-5 font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {collection.label}
                </motion.p>
                <h2 id={i === 0 ? "featured-heading" : undefined} className="text-[clamp(28px,5vw,56px)] font-light text-white tracking-[-0.03em] leading-[1.05]">
                  {collection.title}
                  <br />
                  <span className="font-serif italic font-normal">{collection.subtitle}</span>
                </h2>
                <p className="mt-4 text-white/70 max-w-md leading-relaxed text-[15px] hidden sm:block">
                  {collection.description}
                </p>
                <a 
                  href="/products"
                  className="inline-flex items-center gap-3 mt-8 text-white text-sm font-medium group/cta"
                >
                  <span className="border-b border-white/30 pb-0.5 group-hover/cta:border-white transition-colors">
                    {collection.cta}
                  </span>
                  <span className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full group-hover/cta:bg-white group-hover/cta:text-black transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
