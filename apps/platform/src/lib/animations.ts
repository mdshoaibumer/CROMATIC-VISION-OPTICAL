import type { Variants, Transition } from "framer-motion";

// Shared transition presets
export const springTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 0.8,
};

export const smoothTransition: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

// Fade up reveal (for scroll-triggered elements)
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// Stagger children container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Stagger child item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

// Scale fade (for modals, overlays)
export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

// Slide from right (for sidebars, drawers)
export const slideRightVariants: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: "100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};

// Slide from left
export const slideLeftVariants: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: "-100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};
