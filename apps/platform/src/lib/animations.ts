import type { Variants, Transition } from "framer-motion";

// ═══ REDUCED MOTION DETECTION ═══
// Check if user prefers reduced motion (SSR-safe)
export const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// Helper: returns instant transitions when user prefers reduced motion
function withReducedMotion<T extends Variants>(variants: T): T {
  if (!prefersReducedMotion) return variants;

  const reduced = { ...variants } as Record<string, unknown>;
  for (const key of Object.keys(reduced)) {
    const value = reduced[key];
    if (typeof value === "object" && value !== null && "transition" in (value as object)) {
      reduced[key] = { ...(value as object), transition: { duration: 0 } };
    }
  }
  return reduced as T;
}

// Shared transition presets
export const springTransition: Transition = prefersReducedMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 100, damping: 20, mass: 0.8 };

export const smoothTransition: Transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.6, ease: [0.16, 1, 0.3, 1] };

// Page transition variants
export const pageVariants: Variants = withReducedMotion({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
});

// Fade up reveal (for scroll-triggered elements)
export const fadeUpVariants: Variants = withReducedMotion({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
});

// Stagger children container
export const staggerContainer: Variants = withReducedMotion({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.08,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
});

// Stagger child item
export const staggerItem: Variants = withReducedMotion({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
});

// Scale fade (for modals, overlays)
export const scaleFadeVariants: Variants = withReducedMotion({
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
});

// Slide from right (for sidebars, drawers)
export const slideRightVariants: Variants = withReducedMotion({
  initial: { x: "100%" },
  animate: { x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: "100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
});

// Slide from left
export const slideLeftVariants: Variants = withReducedMotion({
  initial: { x: "-100%" },
  animate: { x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: "-100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
});
