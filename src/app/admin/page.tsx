"use client";

/**
 * Admin: registration requests (Sprint 60).
 *
 * New accounts are PENDING and cannot sign in until approved here, so this page
 * is the only path from "someone registered" to "someone can use the app".
 *
 * Also shows recent outgoing email. In development that is where the password
 * reset link lands, which is what makes the reset flow completable on a machine
 * with no mail provider configured.
 */
import { useCallback, useState } from "react";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";
import { apiFetchSafe } from "@/services/api";

interface RegistrationRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  experienceLevel: string;
  status: string;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
}

interface MailRow {
  id: string;
  to: string;
  subject: string;
  body: string;
  provider: string;
  status: string;
  error: string | null;
  createdAt: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminPage() {
  const [requests, setRequests] = useState<RegistrationRequest[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mail, setMail] = useState<MailRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [openMail, setOpenMail] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [registrations, mailbox] = await Promise.all([
      apiFetchSafe<{ requests: RegistrationRequest[]; counts: Record<string, number> }>(
        "/api/admin/registrations",
      ),
      apiFetchSafe<{ messages: MailRow[] }>("/api/admin/mailbox"),
    ]);
    if (registrations.data) {
      setRequests(registrations.data.requests);
      setCounts(registrations.data.counts);
    }
    if (mailbox.data) setMail(mailbox.data.messages);
    setError(registrations.error ?? mailbox.error);
  }, []);

  useState(() => {
    // Kick off the first load. Kept as a lazy initialiser so the page does not
    // render a "loaded" state that is really "not loaded yet".
    void load();
  });

  const decide = async (email: string, action: "approve" | "reject") => {
    setBusy(email);
    const result = await apiFetchSafe("/api/admin/registrations", {
      method: "POST",
      body: { action, email },
    });
    setBusy(null);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    showToast("success", action === "approve" ? "Approved." : "Rejected.");
    await load();
  };

  if (error && !requests) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <DashboardHeader />
        <main className="py-20 text-center">
          <p className="text-sm text-text-primary">{error}</p>
          <p className="mt-2 text-xs text-text-tertiary">
            This page is restricted to administrators.
          </p>
        </main>
      </div>
    );
  }

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const decided = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-4xl">
          <h1 className="text-2xl font-bold text-text-primary">Administration</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            {counts.pending ?? 0} waiting · {(counts.approved ?? 0)} approved ·{" "}
            {(counts.rejected ?? 0)} rejected
          </p>

          <section className="mt-8">
            <h2 className="text-sm font-bold text-text-primary">
              Registration requests
            </h2>
            {!requests ? (
              <p className="mt-3 text-sm text-text-tertiary">Loading…</p>
            ) : pending.length === 0 ? (
              <p className="mt-3 text-sm text-text-tertiary">
                Nothing waiting. New registrations appear here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="truncate text-xs text-text-tertiary">
                        {r.email} · {r.country} · {r.experienceLevel} ·{" "}
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        disabled={busy === r.email}
                        onClick={() => decide(r.email, "approve")}
                      >
                        {busy === r.email ? "…" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === r.email}
                        onClick={() => decide(r.email, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {decided.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-text-tertiary hover:text-text-secondary">
                  {decided.length} already decided
                </summary>
                <ul className="mt-2 space-y-1">
                  {decided.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <Badge
                        variant={r.status === "approved" ? "primary" : "default"}
                      >
                        {r.status}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-text-secondary">
                        {r.email}
                      </span>
                      <span className="shrink-0 text-text-tertiary">
                        {r.decidedAt ? formatDate(r.decidedAt) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-bold text-text-primary">Outgoing email</h2>
            <p className="mt-1 text-xs text-text-tertiary">
              In development, password reset links appear here. With a mail
              provider configured, this is the delivery log.
            </p>
            {mail.length === 0 ? (
              <p className="mt-3 text-sm text-text-tertiary">No messages yet.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {mail.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-border bg-bg-card px-3 py-2"
                  >
                    <button
                      onClick={() => setOpenMail(openMail === m.id ? null : m.id)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <Badge
                        variant={
                          m.status === "sent"
                            ? "primary"
                            : m.status === "failed"
                              ? "warning"
                              : "default"
                        }
                      >
                        {m.status}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-xs text-text-primary">
                        {m.to}
                      </span>
                      <span className="shrink-0 text-[10px] text-text-tertiary">
                        {formatDate(m.createdAt)}
                      </span>
                    </button>
                    {openMail === m.id && (
                      <div className="mt-2 border-t border-border pt-2">
                        <p className="text-xs font-semibold text-text-primary">
                          {m.subject}
                        </p>
                        {m.error && (
                          <p className="mt-1 text-[10px] text-error">{m.error}</p>
                        )}
                        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px] text-text-tertiary">
                          {m.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
                        </pre>
                        {/* The link is stripped from the HTML for display; the raw
                            body is above, admin-only. */}
                        <ResetLink body={m.body} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Container>
      </main>
    </div>
  );
}

/** Pulls the reset link out of a recorded message so it can be clicked. */
function ResetLink({ body }: { body: string }) {
  const match = body.match(/href="(https?:\/\/[^"]*reset-password[^"]*)"/);
  if (!match) return null;
  return (
    <a
      href={match[1]}
      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
    >
      Open the reset link
    </a>
  );
}
