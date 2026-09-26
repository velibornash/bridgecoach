"use client";

/**
 * Shared data-loading hook (Sprint 58 §21).
 *
 * Gives every migrated page the same four states explicitly — loading, error,
 * empty, success — so no component has to invent them, and no persistence
 * failure is silently swallowed.
 *
 * Usage:
 *   const { data, loading, error, reload } = useApiResource(() => fetchLessons());
 */

import { useCallback, useEffect, useState } from "react";

export interface ApiResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** True once loading has finished and the result is genuinely empty. */
  isEmpty: boolean;
  reload: () => void;
}

export function useApiResource<T>(
  loader: () => Promise<{ data: T | null; error: string | null; status: number }>,
  deps: unknown[] = [],
): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // State is only touched after an await, so the effect never triggers a
      // cascading synchronous render.
      try {
        const result = await loader();
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
          setData(null);
        } else {
          setData(result.data);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Something went wrong");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const isEmpty =
    !loading && error === null && (data === null || (Array.isArray(data) && data.length === 0));

  return { data, loading, error, isEmpty, reload };
}
