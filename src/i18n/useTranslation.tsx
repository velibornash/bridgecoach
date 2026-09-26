"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getTranslation, getLocaleFromString, type Locale, type TranslationKey } from "./translations";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  /**
   * Read back from storage, not just written to it.
   *
   * This wrote `bridgecoach-locale` on every change and never read it, so the
   * language silently reset to English on every reload. The value was persisted
   * and then ignored, which is the write-only bug it looked like on the surface.
   *
   * The initialiser runs once, so there is no hydration mismatch: the server
   * renders `en` and the client's first render does too. Switching language
   * after mount is what re-renders.
   */
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    // `getLocaleFromString` already falls back to English for anything the
    // translation table does not define, so a stale or hand-edited value cannot
    // reach it.
    return getLocaleFromString(window.localStorage.getItem("bridgecoach-locale") ?? "");
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("bridgecoach-locale", l);
  };

  const t = (key: TranslationKey) => getTranslation(locale, key);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used inside LocaleProvider");
  return ctx;
}
