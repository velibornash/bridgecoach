/**
 * Auth client (Sprint 59).
 *
 * Replaces the Sprint 57 `mockLogin` / `mockRegister`, which returned a token
 * that was never stored or verified — so "signing in" changed nothing.
 *
 * The session token is never seen by JavaScript: it lives in an `httpOnly`
 * cookie set by the server. This module only reports success or failure.
 */

import { apiFetch, ApiRequestError } from "./api";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string; code: string };

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const response = await apiFetch<{ user: SessionUser }>("/api/auth", {
      method: "PUT",
      body: { email, password },
    });
    return { ok: true, user: response.user };
  } catch (error) {
    return { ok: false, ...describe(error) };
  }
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  experienceLevel: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  try {
    const response = await apiFetch<{ user: SessionUser }>("/api/auth", {
      method: "POST",
      body: input,
    });
    return { ok: true, user: response.user };
  } catch (error) {
    return { ok: false, ...describe(error) };
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth", { method: "DELETE" });
  } catch {
    // Signing out locally matters more than the server acknowledging it; the
    // cookie is cleared by the response even when the request itself failed.
  }
}

/** The current session, or null when signed out. */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const response = await apiFetch<{ user: SessionUser }>("/api/auth/session");
    return response.user;
  } catch {
    return null;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true; otherSessionsRevoked: number } | { ok: false; error: string }> {
  try {
    const response = await apiFetch<{ changed: boolean; otherSessionsRevoked: number }>(
      "/api/auth/password",
      { method: "PATCH", body: { currentPassword, newPassword } },
    );
    return { ok: true, otherSessionsRevoked: response.otherSessionsRevoked };
  } catch (error) {
    return { ok: false, error: describe(error).error };
  }
}

/** Turns an ApiRequestError into a message safe to show a user. */
function describe(error: unknown): { error: string; code: string } {
  if (error instanceof ApiRequestError) {
    // A generic message for 5xx: internal details are not the user's business.
    if (error.status >= 500) {
      return { error: "Something went wrong. Please try again.", code: error.code };
    }
    return { error: error.message, code: error.code };
  }
  return { error: "Could not reach the server. Check your connection.", code: "NETWORK_ERROR" };
}

// ---------------------------------------------------------------------------
// Validation (kept from the previous module so the forms behave identically)
// ---------------------------------------------------------------------------

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "At least 8 characters";
  if (!/[a-zA-Z]/.test(password)) return "Needs a letter";
  if (!/[0-9]/.test(password)) return "Needs a number";
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  return null;
}

export const countries = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "GR", label: "Greece" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgium" },
  { value: "IE", label: "Ireland" },
  { value: "NZ", label: "New Zealand" },
  { value: "ZA", label: "South Africa" },
];

export const experienceLevels = [
  { value: "new", label: "Just curious" },
  { value: "beginner", label: "New to bridge" },
  { value: "intermediate", label: "Play occasionally" },
  { value: "advanced", label: "Tournament player" },
];
