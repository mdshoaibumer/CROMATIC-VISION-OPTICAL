import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { apiRequest } from "../../lib/api"
import { Category } from "../../types"

const fallbackCategories = [
  {
    name: "Eyeglasses",
    description: "Prescription frames for every style",
    image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&h=1000&fit=crop&q=90",
    href: "/products?category=eyeglasses",
    count: "240+"
  },
  {
    name: "Sunglasses",
    description: "UV protection meets design",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1000&fit=crop&q=90",
    href: "/products?category=sunglasses",
    count: "180+"
  },
  {
    name: "Blue Light",
    description: "Screen-ready protection",
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=600&fit=crop&q=90",
    href: "/products?category=blue-light",
    count: "90+"
  },
  {
    name: "Sports",
    description: "Built for performance",
    image: "https://images.unsplash.com/photo-1622495966027-e0173192c728?w=800&h=600&fit=crop&q=90",
    href: "/products?category=sports",
    count: "60+"
  }
]

const categoryImages = [
  "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&h=1000&fit=crop&q=90",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1000&fit=crop&q=90",
  "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=600&fit=crop&q=90",
  "https://images.unsplash.com/photo-1622495966027-e0173192c728?w=800&h=600&fit=crop&q=90",
]

interface DisplayCategory {
  name: string
  description: string
  image: string
  href: string
  count?: string
}

export function Categories() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [categories, setCategories] = useState<DisplayCategory[]>(fallbackCategories)

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiRequest<Category[]>("/categories")
        if (res?.length) {
          setCategories(res.slice(0, 4).map((cat, i) => ({
            name: cat.name,
            description: cat.description || "Premium eyewear collection",
            image: categoryImages[i % categoryImages.length],
            href: `/products?category=${cat.slug}`,
            count: fallbackCategories[i]?.count || "50+"
          })))
        }
      } catch {
        // Use fallback categories on error
      }
    }
    loadCategories()
  }, [])

  return (
    <section ref={ref} className="section-padding" aria-labelledby="categories-heading">
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-12 lg:mb-16"
        >
          <div>
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={isInView ? { opacity: 1, width: "2rem" } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-foreground/40 mb-4"
            />
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-medium">Categories</p>
            <h2 id="categories-heading" className="text-[clamp(28px,4vw,44px)] font-light tracking-tight text-foreground">
              Shop by <span className="font-serif italic">Style</span>
            </h2>
          </div>
          <a 
            href="/products"
            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            View all
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        {/* Grid - Asymmetric layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">
          {categories.map((category, i) => {
            // First 2 items take 6 cols each, last 2 take 5+7 cols
            const colSpan = i < 2 ? "lg:col-span-6" : i === 2 ? "lg:col-span-5" : "lg:col-span-7"
            const aspect = i < 2 ? "aspect-3/4 sm:aspect-3/4" : "aspect-4/3"
            
            return (
              <motion.a
                key={category.name}
                href={category.href}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative ${aspect} ${colSpan} overflow-hidden bg-secondary rounded-lg`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-7">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{category.count} styles</p>
                      <h3 className="text-white text-xl lg:text-2xl font-medium tracking-tight">{category.name}</h3>
                      <p className="text-white/70 text-sm mt-1 hidden lg:block">{category.description}</p>
                    </div>
                    <span className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm text-white rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
