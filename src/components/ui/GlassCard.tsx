"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cardHover } from "@/design-system/motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "primary" | "secondary" | "elevated" | "premium" | "cloth";
  hover?: boolean;
}

const variants = {
  primary: "bg-bg-card/60 backdrop-blur-xl border-border shadow-lg shadow-black/10",
  secondary: "bg-bg-card/40 backdrop-blur-lg border-border/60 shadow-md",
  elevated: "bg-bg-card/80 backdrop-blur-2xl border-border/80 shadow-xl",
  premium:
    "bg-gradient-to-br from-bg-card/90 via-bg-card/70 to-bg-secondary/80 backdrop-blur-2xl border-premium/20 shadow-premium gradient-border",
  cloth: "bg-cloth/20 backdrop-blur-xl border-accent/20 shadow-lg",
};

export function GlassCard({
  className,
  variant = "primary",
  hover = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={hover ? "rest" : undefined}
      whileHover={hover ? "hover" : undefined}
      whileTap={hover ? "tap" : undefined}
      variants={hover ? cardHover : undefined}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
