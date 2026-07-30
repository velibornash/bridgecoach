"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const faqs = [
  {
    category: "Getting Started",
    items: [
      { q: "What is Bridge Coach?", a: "Bridge Coach is an interactive learning platform that teaches you Contract Bridge through structured lessons, quizzes, and an AI-powered coach. It's designed for absolute beginners through advanced players." },
      { q: "Do I need any prior knowledge?", a: "Not at all! Our Farmer Bob onboarding teaches you everything from scratch. You'll learn suits, trick-taking, and basic bidding in just 8 steps." },
      { q: "How long does it take to learn bridge?", a: "Most beginners can start playing basic hands within a few hours. The full curriculum takes 20-30 hours to complete, but you can learn at your own pace." },
    ],
  },
  {
    category: "Account & Billing",
    items: [
      { q: "How much does Bridge Coach cost?", a: "We offer a free tier with 6 lessons and basic quizzes. Premium ($9.99/mo) unlocks the full curriculum, AI Coach, and detailed analytics. Pro ($19.99/mo) adds advanced courses and priority support." },
      { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your access continues until the end of the current billing period." },
      { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee on all paid plans. Contact us at velja.jagodina@gmail.com for assistance." },
      { q: "How do I upgrade my plan?", a: "Go to the Subscription page in your settings. You can upgrade, downgrade, or cancel your plan at any time." },
    ],
  },
  {
    category: "Learning",
    items: [
      { q: "How does the AI Coach work?", a: "The AI Coach provides instant feedback on your bidding decisions, answers bridge questions, and suggests areas for improvement. It's available on every page via the floating chat button." },
      { q: "What is the XP system?", a: "You earn XP by completing lessons, quizzes, and challenges. XP levels you up from Novice (Level 1) to Legend (Level 12). Each level unlocks new content." },
      { q: "How do achievements work?", a: "There are 12 achievements across 5 categories: lessons, quizzes, streak, mastery, and special. Each has 4 rarity levels (common, rare, epic, legendary)." },
      { q: "Can I track my progress?", a: "Yes! The Statistics page shows hours learned, lessons completed, quiz accuracy, and more. You can also view weekly activity charts and category breakdowns." },
    ],
  },
  {
    category: "Technical",
    items: [
      { q: "Is Bridge Coach available on mobile?", a: "Yes! The platform is fully responsive and works on devices as small as 320px wide. You can learn on your phone, tablet, or desktop." },
      { q: "Is my data safe?", a: "We take security seriously. Your data is encrypted and never shared with third parties. See our Privacy Policy for details." },
      { q: "How do I contact support?", a: "You can reach us at velja.jagodina@gmail.com or use the Contact page to send a message. We typically respond within 24 hours." },
    ],
  },
];

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  const filtered = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (i) => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const totalItems = faqs.reduce((s, c) => s + c.items.length, 0);
  const visibleItems = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Frequently Asked Questions</h1>
            <p className="text-sm text-text-tertiary mb-6">Everything you need to know about Bridge Coach.</p>

            {/* Search */}
            <div className="relative mb-8">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpenId(null); }}
                placeholder="Search FAQ..."
                className="w-full rounded-xl border border-border bg-bg-card pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors placeholder:text-text-tertiary"
              />
            </div>

            {/* Categories */}
            <div className="space-y-6">
              {filtered.map((cat, ci) => (
                <div key={cat.category}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{cat.category}</span>
                    <span className="text-[10px] text-text-tertiary">({cat.items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {cat.items.map((item, ii) => {
                      const id = `faq-${ci}-${ii}`;
                      const isOpen = openId === id;
                      return (
                        <div key={id} className="rounded-xl border border-border bg-bg-card overflow-hidden">
                          <button
                            onClick={() => toggle(id)}
                            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-bg-secondary"
                          >
                            <span className="text-sm font-medium text-text-primary pr-4">{item.q}</span>
                            <svg
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              className={`shrink-0 text-text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            >
                              <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-border px-4 py-3">
                                  <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {search && visibleItems === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                    <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-sm text-text-tertiary">No results for &quot;{search}&quot;</p>
                <p className="text-xs text-text-tertiary mt-1">Try a different search term.</p>
              </div>
            )}
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
