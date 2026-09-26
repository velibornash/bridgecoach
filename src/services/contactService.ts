/**
 * Contact form client (Sprint 60 follow-up).
 */
import { apiFetchSafe } from "./api";

export async function submitContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot. Never displayed; a bot that fills it is silently accepted. */
  website?: string;
}): Promise<{ data: { id: string } | null; error: string | null }> {
  const result = await apiFetchSafe<{ received: boolean; id: string }>("/api/contact", {
    method: "POST",
    body: input,
  });
  return { data: result.data ? { id: result.data.id } : null, error: result.data ? null : result.error };
}
