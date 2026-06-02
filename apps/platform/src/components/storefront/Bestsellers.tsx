import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { Heart, Plus, ArrowUpRight, Star, ShoppingBag } from "lucide-react"
import { apiRequest } from "../../lib/api"
import { useCartStore } from "../../lib/cartStore"
import { Product } from "../../types"

const fallbackProducts = [
  {
    id: 1,
    name: "Aviator Classic",
    price: 299,
    originalPrice: 399,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&q=90",
    colors: 3,
    rating: 4.8,
    reviews: 124,
    tag: "Bestseller"
  },
  {
    id: 2,
    name: "Wayfarer Modern",
    price: 249,
    originalPrice: 0,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop&q=90",
    colors: 5,
    rating: 4.9,
    reviews: 89,
    tag: "New"
  },
  {
    id: 3,
    name: "Round Heritage",
    price: 329,
    originalPrice: 429,
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop&q=90",
    colors: 4,
    rating: 4.7,
    reviews: 203,
    tag: ""
  },
  {
    id: 4,
    name: "Sport Pro",
    price: 279,
    originalPrice: 0,
    image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop&q=90",
    colors: 2,
    rating: 4.6,
    reviews: 67,
    tag: "Trending"
  }
]

interface DisplayProduct {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  colors: number
  slug?: string
  rating?: number
  reviews?: number
  tag?: string
}

function ProductCard({ product, index }: { product: DisplayProduct, index: number }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const { addItem } = useCartStore()

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await addItem(product.id)
    } catch {
      // silent fail for unauthenticated users
    }
  }

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      {/* Image Container */}
      <div className="relative aspect-3/4 bg-secondary/80 mb-4 overflow-hidden rounded-lg">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Tags */}
        {product.tag && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-background/95 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-wider text-foreground rounded-full">
            {product.tag}
          </span>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-3 right-3 md:right-14 px-2 py-1 bg-red-500 text-white text-[11px] font-bold rounded-full">
            -{discount}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setIsFavorited(!isFavorited) }}
          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
            isFavorited 
              ? 'bg-red-50 text-red-500' 
              : 'bg-background/90 backdrop-blur-sm text-foreground/60 opacity-0 group-hover:opacity-100 hover:text-red-500'
          }`}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} strokeWidth={1.5} />
        </button>

        {/* Quick Add - Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleQuickAdd}
            className="w-full h-11 bg-foreground/95 backdrop-blur-sm text-background text-sm font-medium flex items-center justify-center gap-2 rounded-md hover:bg-foreground transition-colors"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            Add to Bag
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2 px-0.5">
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
        )}
        
        <h3 className="font-medium text-foreground text-[15px] leading-tight group-hover:underline underline-offset-2 decoration-foreground/30">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">₹{product.price.toLocaleString()}</span>
          {product.originalPrice && product.originalPrice > 0 && (
            <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Color dots */}
        <div className="flex items-center gap-1.5 pt-1">
          {Array.from({ length: Math.min(product.colors, 5) }).map((_, i) => (
            <span 
              key={i} 
              className="w-3 h-3 rounded-full border border-border"
              style={{ background: ['#1a1a1a', '#8B4513', '#C0C0C0', '#D4A574', '#2F4F4F'][i] }}
            />
          ))}
          {product.colors > 5 && (
            <span className="text-[11px] text-muted-foreground ml-1">+{product.colors - 5}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function Bestsellers() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [products, setProducts] = useState<DisplayProduct[]>(fallbackProducts)

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await apiRequest<{ items: Product[] }>("/products?limit=4")
        if (res?.items?.length) {
          setProducts(res.items.map((p, i) => ({
            id: p.id,
            name: p.name,
            price: p.sale_price || p.price,
            originalPrice: p.sale_price ? p.price : 0,
            image: p.images?.[0]?.image_url || fallbackProducts[0].image,
            colors: 3,
            slug: p.slug,
            rating: fallbackProducts[i % 4]?.rating || 4.5,
            reviews: fallbackProducts[i % 4]?.reviews || 50,
            tag: i === 0 ? "Bestseller" : ""
          })))
        }
      } catch {
        // Use fallback products on error
      }
    }
    loadProducts()
  }, [])

  return (
    <section ref={ref} className="section-padding bg-warm" aria-labelledby="bestsellers-heading">
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
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-medium">Bestsellers</p>
            <h2 id="bestsellers-heading" className="text-[clamp(28px,4vw,44px)] font-light tracking-tight text-foreground">
              Most <span className="font-serif italic">Loved</span>
            </h2>
          </div>
          <a 
            href="/products"
            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            Shop all
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
