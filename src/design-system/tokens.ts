/** Design System 2.0 — Bridge Club tokens */

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const typography = {
  hero: "text-4xl sm:text-5xl font-light tracking-tight leading-tight",
  heading: "text-2xl sm:text-3xl font-semibold tracking-tight",
  sectionTitle: "text-lg font-semibold tracking-tight",
  body: "text-base font-normal leading-relaxed",
  caption: "text-sm text-text-secondary leading-normal",
  label: "text-xs font-medium uppercase tracking-wider",
} as const;

export const surfaces = {
  primary: "bg-bg-card border border-border rounded-2xl shadow-md",
  secondary: "bg-bg-secondary border border-border/60 rounded-xl",
  elevated: "bg-bg-card border border-border/80 rounded-2xl shadow-lg",
  glass: "bg-bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg",
  premium:
    "bg-gradient-to-br from-bg-card/90 via-bg-card/70 to-bg-secondary/80 backdrop-blur-2xl border border-premium/20 rounded-2xl shadow-xl shadow-premium/5",
} as const;

export const semanticColors = {
  success: "text-success",
  warning: "text-warning",
  error: "text-danger",
  info: "text-info",
  premium: "text-premium",
  ai: "text-ai",
  xp: "text-xp",
  locked: "text-locked",
  completed: "text-completed",
} as const;

export type TypographyVariant = keyof typeof typography;
export type SurfaceVariant = keyof typeof surfaces;
