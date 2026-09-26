/**
 * Site configuration (Sprint 58 follow-up, P1).
 *
 * Support addresses were previously hardcoded at six separate call sites, one of
 * which was also the billing address on /subscription. A single source here
 * means changing the address is one edit, and it keeps a personal email address
 * out of the component tree.
 *
 * Server-only: this is imported by pages that render on the server or in a
 * client component that only needs public contact details. It contains no
 * secrets.
 */

export const SITE_CONFIG = {
  name: "Bridge Coach",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@bridgecoach.app",
  salesEmail: process.env.NEXT_PUBLIC_SALES_EMAIL ?? "sales@bridgecoach.app",
  /** Shown wherever the old personal address used to appear. */
  get supportEmailLabel() {
    return this.supportEmail;
  },
} as const;

export const SUPPORT_EMAIL = SITE_CONFIG.supportEmail;
