"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Container className="max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-danger/10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-danger">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-6xl font-bold text-text-primary mb-2">500</h1>
          <h2 className="text-xl font-semibold text-text-secondary mb-3">Something Went Wrong</h2>
          <p className="text-sm text-text-tertiary mb-8 max-w-md mx-auto">
            An unexpected error occurred. Our team has been notified. Please try again or return to the dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-md shadow-glow transition-all">
              Back to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}