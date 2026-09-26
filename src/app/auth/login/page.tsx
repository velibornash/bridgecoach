/**
 * Sign-in (Sprint 60 follow-up).
 *
 * A Server Component that reads `next` and passes it to the form.
 *
 * It used to be a single `"use client"` file whose default export was `async`,
 * which React does not allow — Client Components cannot be async. The build
 * accepted it, so it went unnoticed; `react-hooks/no-async-client-component`
 * is what finally flagged it.
 *
 * Reading the query string here rather than with `useSearchParams()` in the form
 * is also what keeps this route statically prerenderable. The hook forces the
 * whole page into client-side rendering, which broke the build when it was tried
 * during Sprint 59.
 */
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next ?? null} />;
}
