"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center justify-center">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className={cn(
                "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-md border bg-bg-card transition-all duration-150 checked:border-primary checked:bg-primary",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary",
                error ? "border-danger" : "border-border",
                className
              )}
              {...props}
            />
            <svg
              className="pointer-events-none absolute hidden peer-checked:block h-3 w-3 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-sm text-text-secondary select-none [&_a]:text-primary [&_a:hover]:text-primary-hover [&_a]:transition-colors"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-danger ml-7">{error}</p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
