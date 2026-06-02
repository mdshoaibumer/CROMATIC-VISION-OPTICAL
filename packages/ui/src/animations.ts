/**
 * @cromatic/ui — Shared Animation Presets
 * Single source of truth for Framer Motion animation variants
 * Used by both apps/platform and apps/web
 */

import type { Variants, Transition } from "framer-motion";

// ═══ REDUCED MOTION DETECTION ═══
export const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// ═══ EASING CURVES ═══
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeOutQuint = [0.22, 1, 0.36, 1] as const;

// ═══ DURATION SCALE ═══
export const durations = {
  instant: 0,
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
} as const;

// ═══ TRANSITION PRESETS ═══
export const springTransition: Transition = prefersReducedMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 100, damping: 20, mass: 0.8 };

export const smoothTransition: Transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.6, ease: [...easeOut] };

// ═══ ANIMATION VARIANTS ═══

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion ? 0 : 0.6, ease: [...easeOut] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.08,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [...easeOut] },
  },
};

export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: [...easeOut] },
  },
  exit: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96, transition: { duration: 0.2 } },
};

export const slideRightVariants: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [...easeOut] } },
  exit: { x: "100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};

export const slideLeftVariants: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [...easeOut] } },
  exit: { x: "-100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};

// Content entrance with blur (for hero sections)
export const contentVariants: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 40, filter: prefersReducedMotion ? "none" : "blur(4px)" },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : delay, ease: [...easeOut] },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};
