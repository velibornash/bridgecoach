"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

const plans = [
  { id: "free", label: "Free", price: "$0", period: "forever", popular: false },
  { id: "premium", label: "Premium", price: "$9.99", period: "/month", popular: true },
  { id: "pro", label: "Pro", price: "$19.99", period: "/month", popular: false },
];

const invoices = [
  { id: "inv1", date: "Jul 1, 2026", amount: "$9.99", status: "paid" as const, description: "Premium Monthly" },
  { id: "inv2", date: "Jun 1, 2026", amount: "$9.99", status: "paid" as const, description: "Premium Monthly" },
  { id: "inv3", date: "May 1, 2026", amount: "$9.99", status: "paid" as const, description: "Premium Monthly" },
  { id: "inv4", date: "Apr 1, 2026", amount: "$9.99", status: "paid" as const, description: "Premium Monthly" },
  { id: "inv5", date: "Mar 1, 2026", amount: "$9.99", status: "paid" as const, description: "Premium Monthly" },
];

export default function SubscriptionPage() {
  const [plan, setPlan] = useState("premium");
  const [billingEmail, setBillingEmail] = useState("velja.jagodina@gmail.com");

  const usage = { lessons: 8, maxLessons: 20, quizzes: 5, maxQuizzes: 10, aiCoach: true };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary mb-6">Subscription</h1>

            {/* Current Plan */}
            <div className="rounded-xl border border-border bg-bg-card p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Current Plan</h2>
                  <p className="text-xs text-text-tertiary mt-0.5">You are on the Premium plan</p>
                </div>
                <Badge variant="primary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-text-primary">$9.99<span className="text-sm font-normal text-text-tertiary">/month</span></p>
                  <p className="text-xs text-text-tertiary mt-0.5">Renews on Aug 1, 2026</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => showToast("info", "Cancellation submitted")}>Cancel Plan</Button>
              </div>
            </div>

            {/* Upgrade options */}
            <div className="rounded-xl border border-border bg-bg-card p-5 mb-6">
              <h2 className="text-base font-bold text-text-primary mb-4">Available Plans</h2>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPlan(p.id); showToast("success", `Switched to ${p.label} plan`); }}
                    className={`rounded-xl border p-4 text-center transition-all relative ${
                      plan === p.id ? "border-primary bg-primary/10" : "border-border hover:border-border-hover hover:bg-bg-secondary"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-white">Popular</span>
                    )}
                    <p className="text-xs font-medium text-text-secondary mt-1">{p.label}</p>
                    <p className="text-xl font-bold text-text-primary mt-1">{p.price}<span className="text-xs font-normal text-text-tertiary">{p.period}</span></p>
                    <Button size="sm" variant={plan === p.id ? "primary" : "outline"} className="mt-3 w-full">
                      {plan === p.id ? "Current" : "Upgrade"}
                    </Button>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing */}
            <div className="rounded-xl border border-border bg-bg-card p-5 mb-6">
              <h2 className="text-base font-bold text-text-primary mb-4">Billing Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary">Email</label>
                  <input
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Payment Method</label>
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-border bg-bg-secondary px-3 py-2.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                      <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    <span className="text-sm text-text-primary">Visa ending in 4242</span>
                    <span className="text-xs text-text-tertiary ml-auto">Exp 12/28</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => showToast("success", "Billing info updated")}>Update</Button>
              </div>
            </div>

            {/* Usage */}
            <div className="rounded-xl border border-border bg-bg-card p-5 mb-6">
              <h2 className="text-base font-bold text-text-primary mb-4">Monthly Usage</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">Lessons Viewed</span>
                    <span className="text-text-primary font-medium">{usage.lessons}/{usage.maxLessons}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(usage.lessons / usage.maxLessons) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">Quizzes Taken</span>
                    <span className="text-text-primary font-medium">{usage.quizzes}/{usage.maxQuizzes}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(usage.quizzes / usage.maxQuizzes) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">AI Coach</span>
                  <span className="text-success font-medium">Unlimited</span>
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div className="rounded-xl border border-border bg-bg-card p-5">
              <h2 className="text-base font-bold text-text-primary mb-4">Invoices</h2>
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-text-primary">{inv.description}</p>
                      <p className="text-xs text-text-tertiary">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">{inv.amount}</span>
                      <Badge variant="success">{inv.status}</Badge>
                      <button
                        onClick={() => showToast("success", "Invoice downloaded")}
                        className="text-xs text-primary hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
