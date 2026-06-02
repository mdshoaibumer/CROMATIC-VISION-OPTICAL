"use client";

import { useRef, ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface SectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInSection({ children, className = "", delay = 0 }: SectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleInSection({ children, className = "", delay = 0 }: SectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: prefersReduced ? 0 : 0.6, delay: prefersReduced ? 0 : delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInSection({ children, className = "", delay = 0, direction = "left" }: SectionProps & { direction?: "left" | "right" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: direction === "left" ? -60 : 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: direction === "left" ? -60 : 60 }}
      transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReduced ? 0 : 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 30 },
        visible: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0 : 0.5, ease: [0.25, 0.4, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
