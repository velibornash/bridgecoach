import { vi } from "vitest";

/**
 * Shared mocks for tests that exercise Next.js navigation hooks.
 */

export function mockNextNavigation() {
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();

  vi.mock("next/navigation", () => ({
    useRouter: () => ({ push, replace, back, prefetch: vi.fn() }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  }));

  return { push, replace, back };
}
