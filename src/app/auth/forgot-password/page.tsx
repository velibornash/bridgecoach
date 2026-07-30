"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Container } from "@/components/ui/Container";
import { showToast } from "@/components/ui/Toast";
import { mockForgotPassword, validateEmail } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setError(err); return; }

    setIsLoading(true);
    try {
      await mockForgotPassword(email);
      setIsSent(true);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <Container className="flex flex-1 items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-glow">
                <span className="text-sm font-bold text-white">♠</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-text-primary">
                Bridge Coach
              </span>
            </Link>

            <AnimatePresence mode="wait">
              {isSent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    We sent a password reset link to <strong className="text-text-primary">{email}</strong>.
                    It may take a minute to arrive.
                  </p>
                  <p className="mt-6 text-sm text-text-tertiary">
                    Didn&apos;t receive it?{" "}
                    <button
                      onClick={() => setIsSent(false)}
                      className="font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      Send again
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-text-primary">Forgot password?</h1>
                  <p className="mt-1.5 text-sm text-text-secondary">
                    No worries. Enter your email and we&apos;ll send you a reset link.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {!isSent && (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  error={error || undefined}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  }
                />

                <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                  Send Reset Link
                </Button>

                <p className="text-center">
                  <Link href="/auth/login" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                    Back to log in
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {!isSent && (
            <p className="mt-8 text-center text-sm text-text-secondary">
              Remember your password?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
                Log in
              </Link>
            </p>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
