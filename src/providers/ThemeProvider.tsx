"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: "dark" | "light";
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("bridgecoach-theme");
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [resolved, setResolved] = useState<"dark" | "light">(() => {
    const stored = getStoredTheme();
    return stored === "system" ? getSystemPreference() : stored;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      if (theme === "system") setResolved(mq.matches ? "light" : "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    if (resolved === "light") {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }
  }, [resolved]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("bridgecoach-theme", t);
    if (t === "system") {
      setResolved(getSystemPreference());
    } else {
      setResolved(t);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
