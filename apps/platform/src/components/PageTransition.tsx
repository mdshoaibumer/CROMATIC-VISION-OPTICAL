import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageVariants } from "../lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a smooth enter/exit animation.
 * Use inside AnimatePresence with a unique key (e.g. location.pathname).
 */
export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
