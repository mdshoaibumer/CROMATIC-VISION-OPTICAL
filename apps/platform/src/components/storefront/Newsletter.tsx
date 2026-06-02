import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Check, Mail } from "lucide-react"

export function Newsletter() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setIsSubmitted(true)
  }

  return (
    <section ref={ref} className="section-padding" aria-labelledby="newsletter-heading">
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-secondary/60 rounded-2xl p-8 sm:p-12 lg:p-20 overflow-hidden"
        >
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-secondary to-transparent opacity-50 pointer-events-none" />
          
          <div className="relative max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-14 h-14 mx-auto mb-6 flex items-center justify-center bg-foreground/5 rounded-full"
            >
              <Mail className="w-6 h-6 text-foreground/60" strokeWidth={1.5} />
            </motion.div>

            <h2 id="newsletter-heading" className="text-[clamp(28px,4vw,44px)] font-light tracking-tight text-foreground">
              Stay in the <span className="font-serif italic">frame</span>
            </h2>
            
            <p className="mt-4 text-muted-foreground text-[15px] max-w-md mx-auto">
              New arrivals, exclusive member offers, and style guides. Join 25,000+ subscribers.
            </p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="mt-8">
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-1 h-11 md:h-13 px-4 md:px-5 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm md:text-[15px]"
                    aria-label="Email address"
                  />
                  <button
                    type="submit"
                    className="h-11 md:h-13 px-5 md:px-7 bg-foreground text-background font-medium flex items-center justify-center gap-2 rounded-lg hover:bg-foreground/90 transition-all duration-200 hover:shadow-lg text-sm md:text-[15px] shrink-0"
                  >
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 inline-flex items-center gap-3 px-5 py-3 bg-green-50 text-green-700 rounded-lg"
              >
                <Check className="w-5 h-5" />
                <span className="font-medium">You're subscribed! Check your inbox.</span>
              </motion.div>
            )}

            <p className="mt-4 text-xs text-muted-foreground/70">
              No spam, unsubscribe anytime. By subscribing you agree to our Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
