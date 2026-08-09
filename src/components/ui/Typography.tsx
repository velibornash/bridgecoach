import { cn } from "@/lib/utils";
import { typography, type TypographyVariant } from "@/design-system/tokens";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "label";
  gradient?: boolean;
}

export function Typography({
  variant = "body",
  as,
  gradient,
  className,
  children,
  ...props
}: TypographyProps) {
  const defaultTag: Record<TypographyVariant, TypographyProps["as"]> = {
    hero: "h1",
    heading: "h2",
    sectionTitle: "h3",
    body: "p",
    caption: "p",
    label: "label",
  };

  const Tag = (as ?? defaultTag[variant]) as React.ElementType;

  return (
    <Tag
      className={cn(
        typography[variant],
        variant === "hero" && "text-text-primary",
        variant === "heading" && "text-text-primary",
        variant === "sectionTitle" && "text-text-primary",
        variant === "body" && "text-text-primary",
        variant === "caption" && "text-text-secondary",
        variant === "label" && "text-text-tertiary",
        gradient && "gradient-text",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
