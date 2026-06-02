import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Camera, RotateCcw, Sparkles, Scan } from "lucide-react"

const features = [
  { icon: Camera, label: "Real-time preview", desc: "See frames on your face instantly" },
  { icon: RotateCcw, label: "360° view", desc: "Rotate and examine every angle" },
  { icon: Sparkles, label: "AI recommendations", desc: "Get personalized style matches" },
  { icon: Scan, label: "Face shape analysis", desc: "Find your perfect fit" }
]

export function VirtualTryOn() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="section-padding" aria-labelledby="tryon-heading">
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={isInView ? { opacity: 1, width: "2rem" } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-foreground/40 mb-4"
            />
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-medium">
              Virtual Try-On
            </p>
            
            <h2 id="tryon-heading" className="text-[clamp(28px,4vw,48px)] font-light tracking-tight leading-[1.1] text-foreground">
              See yourself
              <br />
              <span className="font-serif italic font-normal">before you buy</span>
            </h2>
            
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed text-[15px]">
              Use your camera to try on any frame instantly. Our AI-powered technology helps you find the perfect fit and style for your unique face shape.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-10">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center bg-secondary rounded-md shrink-0">
                    <feature.icon className="w-4 h-4 text-foreground/70" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="/try-on"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="inline-flex items-center gap-3 mt-8 md:mt-10 h-10 md:h-12 px-5 md:px-7 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-all duration-200 hover:shadow-lg group"
            >
              Try It Now
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </motion.a>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 lg:order-2 relative"
          >
            <div className="aspect-4/5 relative overflow-hidden bg-secondary rounded-xl">
              <img
                src="https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=1000&fit=crop&q=90"
                alt="Person trying on glasses virtually"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Floating UI Element */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-5 left-5 right-5 bg-background/98 backdrop-blur-md p-4 flex items-center justify-between rounded-lg shadow-lg"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Aviator Classic</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-xs text-green-700 font-medium">Great fit for your face shape</p>
                  </div>
                </div>
                <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center rounded-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Scanning overlay effect */}
              <motion.div
                initial={{ top: "0%" }}
                animate={isInView ? { top: ["0%", "100%", "0%"] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/60 to-transparent"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
