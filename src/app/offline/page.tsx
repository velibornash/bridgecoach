"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Container className="max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-warning/10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warning">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-6xl font-bold text-text-primary mb-2">Offline</h1>
          <h2 className="text-xl font-semibold text-text-secondary mb-3">No Internet Connection</h2>
          <p className="text-sm text-text-tertiary mb-8 max-w-md mx-auto">
            It looks like you&apos;re not connected to the internet. Check your connection and try again.
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs text-text-tertiary">Checking connection...</span>
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>

          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-md shadow-glow transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Go to Dashboard
          </Link>
        </motion.div>
      </Container>
    </div>
  );
}