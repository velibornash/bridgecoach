"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LocaleProvider } from "@/i18n/useTranslation";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        {children}
      </LocaleProvider>
    </ThemeProvider>
  );
}
