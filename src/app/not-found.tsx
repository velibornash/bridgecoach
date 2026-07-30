"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Container className="max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-bg-secondary">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
              <path d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
              <path d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
              <path d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>

          <h1 className="text-6xl font-bold text-text-primary mb-2">404</h1>
          <h2 className="text-xl font-semibold text-text-secondary mb-3">Page Not Found</h2>
          <p className="text-sm text-text-tertiary mb-8 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-md shadow-glow transition-all">
              Go to Dashboard
            </Link>
            <Link href="/learning-path" className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all">
              Browse Lessons
            </Link>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}