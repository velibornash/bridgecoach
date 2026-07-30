"use client";

import { cn } from "@/lib/utils";
import { surfaces, type SurfaceVariant } from "@/design-system/tokens";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cardHover } from "@/design-system/motion";

interface SurfaceProps extends HTMLMotionProps<"div"> {
  variant?: SurfaceVariant;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Surface({
  variant = "primary",
  hover = false,
  padding = "md",
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <motion.div
      initial={hover ? "rest" : undefined}
      whileHover={hover ? "hover" : undefined}
      whileTap={hover ? "tap" : undefined}
      variants={hover ? cardHover : undefined}
      className={cn(surfaces[variant], paddingMap[padding], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
