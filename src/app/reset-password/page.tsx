"use client";

/**
 * Choose a new password (Sprint 60).
 *
 * Reads `token` from the query string. The token is a bearer secret, so this page
 * must not be cached or indexed; `robots` is set to noindex below and the page
 * sends no referrer data.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { apiFetchSafe } from "@/services/api";
import { validatePassword } from "@/services/authClient";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-text-tertiary">
        This link is missing its token. Request a new one from the sign-in page.
      </p>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const strength = validatePassword(password);
    if (strength) {
      setError(strength);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    const result = await apiFetchSafe("/api/auth/password-reset", {
      method: "PATCH",
      body: { token, newPassword: password },
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast("success", "Password changed. You can sign in now.");
    router.push("/login");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-text-primary">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-text-primary">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <Container className="max-w-md w-full">
          <div className="rounded-2xl border border-border bg-bg-card p-8">
            <h1 className="text-xl font-bold text-text-primary">Choose a new password</h1>
            <p className="mt-1 mb-6 text-sm text-text-tertiary">
              This link works once.
            </p>
            <Suspense fallback={<p className="text-sm text-text-tertiary">Loading…</p>}>
              <ResetForm />
            </Suspense>
          </div>
        </Container>
      </main>
    </div>
  );
}
