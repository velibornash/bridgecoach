"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel = false,
}: ProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-bg-secondary",
          className
        )}
        value={value}
        max={max}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out",
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs font-medium text-text-tertiary">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
