import { useRef, type ReactNode } from "react"
import { motion, useInView } from "framer-motion"
import { easeOut } from "../../lib/design-tokens"

/**
 * Section wrapper with the standard max-width, padding, and scroll-reveal animation.
 */
export function Section({
  children,
  className = "",
  id,
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  id?: string
  ariaLabel?: string
}) {
  return (
    <section id={id} className={`section-padding ${className}`} aria-label={ariaLabel}>
      <div className="max-w-360 mx-auto px-6 lg:px-10">
        {children}
      </div>
    </section>
  )
}

/**
 * Page container used for inner pages (Products, Checkout, Account, etc.)
 * Provides consistent max-width, vertical padding, and horizontal padding.
 */
export function PageContainer({
  children,
  className = "",
  maxWidth = "max-w-360",
}: {
  children: ReactNode
  className?: string
  maxWidth?: string
}) {
  return (
    <div className={`bg-background min-h-[85vh] py-12 md:py-16 px-6 lg:px-10 ${maxWidth} mx-auto w-full ${className}`}>
      {children}
    </div>
  )
}

/**
 * Section header following the homepage pattern:
 * - Optional accent line
 * - Small uppercase label
 * - Large heading with serif-italic keyword
 * - Optional description
 */
export function SectionHeader({
  label,
  heading,
  headingItalic,
  description,
  align = "left",
  className = "",
}: {
  label?: string
  heading: string
  headingItalic?: string
  description?: string
  align?: "left" | "center"
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: easeOut as unknown as number[] }}
      className={`${align === "center" ? "text-center" : ""} ${className}`}
    >
      {label && (
        <>
          {align === "left" && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={isInView ? { opacity: 1, width: "2rem" } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-foreground/40 mb-4"
            />
          )}
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-medium">
            {label}
          </p>
        </>
      )}
      <h2 className="text-[clamp(28px,4vw,44px)] font-light tracking-tight text-foreground">
        {heading}{" "}
        {headingItalic && <span className="font-serif italic">{headingItalic}</span>}
      </h2>
      {description && (
        <p className="mt-4 text-muted-foreground text-[15px] max-w-lg leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  )
}

/**
 * Scroll-reveal wrapper for individual elements.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
  key?: string | number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: easeOut as unknown as number[] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Empty state component matching homepage aesthetic.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="text-center py-20 max-w-sm mx-auto space-y-5">
      <div className="w-16 h-16 mx-auto flex items-center justify-center bg-secondary rounded-2xl">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="h-12 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all duration-200 inline-flex items-center gap-2"
        >
          {action}
        </button>
      )}
    </div>
  )
}
