"use client";

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
  if (typeof icon === "string") {
    const IconComponent = emojiToIcon(icon);
    if (!IconComponent) return null;
    return <IconComponent size={size} strokeWidth={strokeWidth} className={cn("inline-block", className)} style={{ color }} />;
  }

  const IconComponent = icon;
  return <IconComponent size={size} strokeWidth={strokeWidth} className={cn("inline-block", className)} style={{ color }} />;
}
