/**
 * Cromatic Vision Optical — Shared Design Tokens
 * Single source of truth for the premium design system.
 * All pages must use these tokens to maintain visual consistency.
 */

// ═══ ANIMATION ═══
export const easeOut = [0.16, 1, 0.3, 1] as const
export const easeOutQuint = [0.22, 1, 0.36, 1] as const
export const easeSpring = { type: "spring" as const, stiffness: 300, damping: 25 }

export const durations = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
} as const

// Standard reveal animation (fade-in + slide-up)
export const revealVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: easeOut },
  }),
}

// Stagger children
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
}

// Content entrance with blur
export const contentVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay, ease: easeOut },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

// ═══ LAYOUT ═══
export const layout = {
  maxWidth: "max-w-360",
  padding: "px-6 lg:px-10",
  sectionPadding: "section-padding",
  containerClass: "max-w-360 mx-auto px-6 lg:px-10",
} as const

// ═══ TYPOGRAPHY ═══
export const typography = {
  // Section headers
  sectionLabel: "text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium",
  sectionHeading: "text-[clamp(28px,4vw,44px)] font-light tracking-tight text-foreground",
  pageTitle: "text-[clamp(2rem,5vw,3rem)] font-light tracking-[-0.02em] text-foreground",
  // Body text
  body: "text-[15px] text-muted-foreground leading-relaxed",
  bodySmall: "text-sm text-muted-foreground",
  // Card text
  cardTitle: "text-sm font-medium text-foreground",
  cardMeta: "text-xs text-muted-foreground",
  // Labels
  inputLabel: "text-xs font-medium text-foreground block mb-1.5",
  badge: "text-[11px] font-semibold uppercase tracking-wider",
} as const

// ═══ COMPONENTS ═══
export const components = {
  // Buttons
  btnPrimary: "h-12 md:h-14 px-6 md:px-8 bg-foreground text-background text-sm md:text-[15px] font-medium hover:bg-foreground/90 transition-all duration-300 hover:shadow-lg rounded-lg inline-flex items-center justify-center gap-2",
  btnSecondary: "h-12 md:h-14 px-6 md:px-8 border border-border text-foreground text-sm md:text-[15px] font-medium hover:bg-secondary transition-all duration-200 rounded-lg inline-flex items-center justify-center gap-2",
  btnGhost: "px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors duration-200 rounded-lg inline-flex items-center gap-2",
  // Inputs
  input: "w-full h-12 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm",
  // Cards
  card: "bg-card border border-border rounded-xl p-6 transition-all duration-200",
  cardHover: "bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-border/80 transition-all duration-300",
  // Badges
  badgeDefault: "px-2.5 py-1 bg-secondary text-foreground text-[11px] font-semibold uppercase tracking-wider rounded-full",
  badgeSuccess: "px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full border border-green-200",
  badgeWarning: "px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-full border border-amber-200",
  badgeError: "px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-semibold rounded-full border border-red-200",
  badgeInfo: "px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-200",
  // Dividers
  divider: "h-px bg-border",
  sectionDivider: "border-t border-border",
} as const
