"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { mockExtendedCertificates } from "@/services/mockData";
import { showToast } from "@/components/ui/Toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-4xl">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.h1 variants={item} className="text-2xl font-bold text-text-primary mb-2">Certificates</motion.h1>
            <motion.p variants={item} className="text-sm text-text-tertiary mb-8">
              Complete courses to earn certificates. {mockExtendedCertificates.length} earned so far.
            </motion.p>

            <div className="grid gap-6 sm:grid-cols-2">
              {mockExtendedCertificates.map((cert) => (
                <motion.div key={cert.id} variants={item} className="group">
                  {/* Certificate preview card */}
                  <div className="relative rounded-xl border border-border bg-bg-card overflow-hidden">
                    {/* Gold seal decoration */}
                    <div className="absolute top-3 right-3 h-14 w-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg opacity-80">
                      <span className="text-xl">🏆</span>
                    </div>

                    {/* Header gradient */}
                    <div className={`bg-gradient-to-r ${cert.gradient} px-6 py-8 relative`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                      <div className="relative">
                        <p className="text-[10px] uppercase tracking-widest text-white/70 mb-1">Certificate of Completion</p>
                        <h3 className="text-lg font-bold text-white">{cert.title}</h3>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5">
                      <p className="text-xs text-text-tertiary leading-relaxed mb-4">{cert.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {cert.earnedAt}
                        </div>

                        <button
                          onClick={() => showToast("success", "Certificate downloaded!")}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty state if no certificates */}
            {mockExtendedCertificates.length === 0 && (
              <motion.div variants={item} className="text-center py-20">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg-secondary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <p className="text-sm text-text-tertiary">No certificates yet.</p>
                <p className="text-xs text-text-tertiary mt-1">Complete courses to earn your first certificate.</p>
              </motion.div>
            )}
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
