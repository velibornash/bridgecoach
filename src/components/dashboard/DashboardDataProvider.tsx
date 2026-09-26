"use client";

/**
 * Dashboard data provider (Sprint 58 §11, §19, §26).
 *
 * Seven dashboard components used to import `mockUser` directly, so the page
 * issued no requests and rendered fixture numbers. They now read from this
 * context, which fetches `/api/dashboard` ONCE and shares the result — no N+1
 * fetching, and no call-site changes for the components that consume it.
 *
 * While loading, or if the request fails, the context exposes nulls and each
 * component decides what to render. `useDashboardData` never throws.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchDashboard, type DashboardData } from "@/services/userService";

const DashboardContext = createContext<{
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}>({ data: null, loading: true, error: null });

export function useDashboardData() {
  return useContext(DashboardContext);
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchDashboard();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load your progress");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardContext.Provider value={{ data, loading, error }}>
      {children}
    </DashboardContext.Provider>
  );
}
