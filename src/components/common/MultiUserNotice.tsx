"use client";

/**
 * Multi-user feature notice (Sprint 58 §28).
 *
 * `/leaderboard`, `/friends`, `/community` and `/profile/[id]` all describe OTHER
 * users. The database contains exactly one user — the development identity —
 * because real authentication is Sprint 59. Showing a persisted list here would
 * be impossible, and inventing users would be exactly the mock-data problem this
 * sprint exists to remove.
 *
 * So these pages keep their fixture CONTENT (realistic names and scores make the
 * UI reviewable) but say so plainly, so nobody mistakes it for real data and no
 * user is shown a fabricated rank.
 */
import { Info } from "lucide-react";

export function MultiUserNotice({
  feature,
  className = "",
}: {
  feature: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3.5 py-3 ${className}`}
    >
      <Info size={15} className="mt-0.5 shrink-0 text-amber-400" />
      <p className="text-xs leading-relaxed text-amber-100/80">
        <span className="font-semibold text-amber-200">{feature}</span> needs multiple
        user accounts, so it currently shows sample data. Real accounts arrive with
        authentication in Sprint 59 — until then nothing here reflects your actual
        standing.
      </p>
    </div>
  );
}
