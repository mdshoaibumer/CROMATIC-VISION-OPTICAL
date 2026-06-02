import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Shield, Truck, RotateCcw, Award, Clock, CreditCard } from "lucide-react"

const trustItems = [
  {
    icon: Truck,
    title: "Free Express Shipping",
    description: "Complimentary 2-day delivery on all orders above ₹3,000"
  },
  {
    icon: RotateCcw,
    title: "14-Day Easy Returns",
    description: "Not the right fit? Return hassle-free within 14 days"
  },
  {
    icon: Shield,
    title: "1-Year Warranty",
    description: "Full coverage on all frames and lenses against defects"
  },
  {
    icon: Award,
    title: "Certified Authentic",
    description: "100% genuine products from authorized brand partners"
  },
  {
    icon: Clock,
    title: "Same-Day Dispatch",
    description: "Orders placed before 2 PM ship the same business day"
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "256-bit SSL encryption. Pay with cards, UPI, or EMI"
  }
]

export function TrustSignals() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section ref={ref} className="py-16 lg:py-24" aria-label="Our guarantees">
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium mb-3">
            Why Choose Us
          </p>
          <h2 className="text-[clamp(24px,3vw,36px)] font-light tracking-[-0.02em] text-foreground">
            The Cromatic <span className="font-serif italic">Promise</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-secondary/50 transition-colors duration-200"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-xl mb-4">
                <item.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
