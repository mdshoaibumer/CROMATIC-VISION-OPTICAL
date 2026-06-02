import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const brands = [
  { name: "Ray-Ban", logo: "Ray-Ban" },
  { name: "Oakley", logo: "OAKLEY" },
  { name: "Gucci", logo: "GUCCI" },
  { name: "Prada", logo: "PRADA" },
  { name: "Tom Ford", logo: "TOM FORD" },
  { name: "Cartier", logo: "Cartier" },
  { name: "Versace", logo: "VERSACE" },
  { name: "Dior", logo: "DIOR" },
]

export function Brands() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section ref={ref} className="py-16 lg:py-24 border-y border-border" aria-label="Partner brands">
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
            Official Authorized Retailer
          </p>
        </motion.div>

        {/* Desktop: Grid display */}
        <div className="hidden md:grid grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-6">
          {brands.map((brand, i) => (
            <motion.a
              key={brand.name}
              href={`/products?brand=${brand.name.toLowerCase().replace(' ', '-')}`}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center py-6 text-muted-foreground/60 hover:text-foreground transition-all duration-300 group"
              aria-label={brand.name}
            >
              <span className="text-[15px] font-semibold tracking-wider group-hover:scale-110 transition-transform duration-300">
                {brand.logo}
              </span>
            </motion.a>
          ))}
        </div>

        {/* Mobile: Marquee scroll */}
        <div className="md:hidden marquee-container">
          <div className="marquee-content">
            {[...brands, ...brands].map((brand, i) => (
              <a
                key={`${brand.name}-${i}`}
                href={`/products?brand=${brand.name.toLowerCase().replace(' ', '-')}`}
                className="flex items-center justify-center px-8 py-4 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <span className="text-[14px] font-semibold tracking-wider whitespace-nowrap">
                  {brand.logo}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
