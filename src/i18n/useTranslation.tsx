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
  const [locale, setLocaleState] = useState<Locale>("en");

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
