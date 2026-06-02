/**
 * @cromatic/ui — Shared Design Tokens
 * Use these constants for consistent spacing, typography, and color references.
 */

// ═══ SPACING SCALE ═══
export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
  "4xl": "6rem",
  "5xl": "8rem",
} as const;

// ═══ BREAKPOINTS ═══
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ═══ Z-INDEX SCALE ═══
export const zIndex = {
  dropdown: 50,
  sticky: 100,
  fixed: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
} as const;

// ═══ TRANSITION DURATIONS (CSS) ═══
export const transitions = {
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
  slower: "800ms",
} as const;

// ═══ EASING (CSS) ═══
export const easings = {
  outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
  outQuint: "cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
