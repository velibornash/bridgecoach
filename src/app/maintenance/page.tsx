"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [show, setShow] = useState(false);

  useEffect(() => setShow(true), []);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Container className="max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={show ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <path d="M14.25 9.75L3 20.25M3 9.75l11.25 10.5M9 21h6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
            </svg>
          </div>

          <h1 className="text-6xl font-bold text-text-primary mb-2">Under Maintenance</h1>
          <h2 className="text-xl font-semibold text-text-secondary mb-3">We&apos;ll Be Right Back</h2>
          <p className="text-sm text-text-tertiary mb-8 max-w-md mx-auto">
            Bridge Coach is currently undergoing scheduled maintenance to improve your experience.
            We&apos;ll be back shortly. Thank you for your patience!
          </p>

          <div className="flex items-center justify-center gap-1.5 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite both` }}
              />
            ))}
          </div>

          <style>{`
            @keyframes pulse {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>

          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-md shadow-glow transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Return to Dashboard
          </Link>

          <p className="text-xs text-text-tertiary mt-6">
            Estimated time: 5–10 minutes. We&apos;ll notify you when we&apos;re back.
          </p>
        </motion.div>
      </Container>
    </div>
  );
}