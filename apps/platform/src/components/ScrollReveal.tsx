import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUpVariants, staggerContainer, staggerItem } from "../lib/animations";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

/**
 * Wraps children in a fade-up animation triggered on scroll into view.
 */
export function ScrollReveal({ children, className, delay = 0, once = true }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      variants={fadeUpVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
}

/**
 * Container that staggers the entrance of its direct children.
 * Each direct child should be wrapped in a StaggerItem.
 */
export function StaggerReveal({ children, className, once = true }: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
