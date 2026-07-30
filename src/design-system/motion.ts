import type { Transition, Variants } from "framer-motion";

/** Standard easing — short, elegant, never distracting */
export const easing = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  spring: { type: "spring" as const, stiffness: 300, damping: 24 },
};

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  completion: 0.6,
} as const;

export const transitions: Record<string, Transition> = {
  hover: { duration: duration.base, ease: easing.smooth },
  press: { duration: duration.fast, ease: easing.smooth },
  page: { duration: duration.slow, ease: easing.smooth },
  modal: { duration: duration.base, ease: easing.smooth },
  success: { duration: duration.completion, ease: easing.smooth },
  loading: { duration: 1.2, ease: "linear", repeat: Infinity },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: transitions.hover },
  tap: { scale: 0.98, transition: transitions.press },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.smooth } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.base } },
};

export const badgeUnlock: Variants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 18 },
  },
};

export const progressRing: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (progress: number) => ({
    pathLength: progress / 100,
    opacity: 1,
    transition: { duration: duration.completion, ease: easing.smooth },
  }),
};
