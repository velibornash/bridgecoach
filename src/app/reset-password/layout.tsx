import type { Metadata } from "next";

/**
 * The URL of this page carries a bearer token: `/reset-password?token=…`.
 *
 * Two consequences, both handled here rather than in the page:
 * - `robots: noindex` so a search engine cannot capture a working reset link.
 * - `referrer: no-referrer` so the token is not leaked to any third party the
 *   user navigates to afterwards.
 *
 * This lives in a layout because the page is a Client Component, and `metadata`
 * may only be exported from a Server Component.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
