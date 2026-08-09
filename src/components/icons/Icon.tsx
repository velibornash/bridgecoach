"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import { emojiToIcon } from "@/components/icons/emojiMap";
import type { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon | string;
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ icon, size = 16, className, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  const resolved: LucideIcon | null = typeof icon === "string" ? emojiToIcon(icon) : icon;
  if (!resolved) return null;
  return createElement(resolved, {
    size,
    strokeWidth,
    className: cn("inline-block", className),
    style: { color },
  });
}
