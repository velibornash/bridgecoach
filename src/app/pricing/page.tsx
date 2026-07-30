"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Accordion } from "@/components/ui/Accordion";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start your bridge journey.",
    features: [
      "First 10 lessons",
      "Basic quizzes",
      "Daily challenges",
      "XP tracking & achievements",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    highlight: false,
    popular: false,
  },
  {
    name: "Premium",
    price: "$9",
    period: "/month",
    description: "The complete experience.",
    features: [
      "All 200+ lessons",
      "Advanced quizzes & puzzles",
      "AI Coach feedback",
      "Unlimited daily challenges",
      "Partner matching",
      "Priority support",
    ],
    cta: "Start Free Trial",
    variant: "primary" as const,
    highlight: true,
    popular: true,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious learners.",
    features: [
      "Everything in Premium",
      "Live tournaments access",
      "Expert analysis",
      "Custom learning plans",
      "Advanced hand analysis",
      "API access for tools",
    ],
    cta: "Go Pro",
    variant: "outline" as const,
    highlight: false,
    popular: false,
  },
  {
    name: "Elite",
    price: "Custom",
    period: "",
    description: "For clubs & coaches.",
    features: [
      "Everything in Pro",
      "Unlimited student seats",
      "Class management dashboard",
      "Custom branding",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    highlight: false,
    popular: false,
  },
];

const allFeatures = [
  { name: "Lessons", free: "10", premium: "200+", pro: "200+", elite: "200+" },
  { name: "Quizzes", free: "Basic", premium: "Advanced", pro: "Advanced+", elite: "Advanced+" },
  { name: "Daily Challenges", free: "1/day", premium: "Unlimited", pro: "Unlimited", elite: "Unlimited" },
  { name: "XP & Achievements", free: true, premium: true, pro: true, elite: true },
  { name: "AI Coach", free: false, premium: "Limited", pro: "Full", elite: "Full" },
  { name: "Partner Matching", free: false, premium: true, pro: true, elite: true },
  { name: "Live Tournaments", free: false, premium: false, pro: true, elite: true },
  { name: "Expert Analysis", free: false, premium: false, pro: true, elite: true },
  { name: "Custom Learning Plans", free: false, premium: false, pro: true, elite: true },
  { name: "Student Management", free: false, premium: false, pro: false, elite: true },
  { name: "Custom Branding", free: false, premium: false, pro: false, elite: true },
  { name: "Priority Support", free: false, premium: true, pro: true, elite: true },
];

const faqs = [
  { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade at any time. When upgrading, you get immediate access to new features. When downgrading, changes apply at the end of your billing cycle." },
  { q: "Is there a free trial for Premium?", a: "Absolutely! You get a 7-day free trial of Premium with full access to all features. No credit card required to start." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and Apple Pay. For Elite plans, we also support invoicing and bank transfers." },
  { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime from your Settings page. Your access continues until the end of your paid period." },
  { q: "Is there a student discount?", a: "Yes, we offer 50% off Premium for verified students. Contact our support team with your student ID." },
  { q: "Do you offer refunds?", a: "We offer a 30-day money-back guarantee on all paid plans. If you are not satisfied, we will refund your full payment." },
];

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-tertiary shrink-0">
    <path d="M5 12h14" />
  </svg>
);

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const discounted = (price: string) => {
    if (price === "$9") return annual ? "$7" : "$9";
    if (price === "$19") return annual ? "$15" : "$19";
    return price;
  };

  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />
      <div className="pt-24 pb-24 sm:pb-32">
        <Container>
          {/* Header */}
          <div className="text-center">
            <Badge variant="primary" className="mb-4">Pricing</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              Start free. Upgrade when you are ready. All plans include a 7-day free trial.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-bg-secondary p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  !annual ? "bg-primary text-white" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  annual ? "bg-primary text-white" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Annual
                <span className="ml-1.5 text-[10px] text-white/70">Save up to 20%</span>
              </button>
            </div>
          </div>

          {/* Plans grid */}
          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card
                  className={`relative flex h-full flex-col transition-all duration-150 ${
                    plan.highlight
                      ? "border-primary/50 shadow-glow scale-[1.02]"
                      : "hover:border-border-hover"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="premium">Most Popular</Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-text-primary">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-text-primary">
                        {discounted(plan.price)}
                      </span>
                      <span className="text-sm text-text-tertiary">{plan.period}</span>
                    </div>
                    {annual && plan.price !== "$0" && plan.price !== "Custom" && (
                      <p className="mt-1 text-xs text-success">
                        <s className="text-text-tertiary mr-1">{plan.price}</s>
                        {discounted(plan.price)}/mo billed annually
                      </p>
                    )}
                    <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
                  </div>

                  <ul className="mb-8 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckIcon />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.price === "Custom" ? "/contact" : "/auth/register"}>
                    <Button variant={plan.variant} size="lg" className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-text-primary text-center mb-8">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Feature</th>
                    {plans.map((p) => (
                      <th key={p.name} className={`py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider ${
                        p.highlight ? "text-primary" : "text-text-tertiary"
                      }`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((f, i) => (
                    <tr key={f.name} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-bg-card/30" : ""}`}>
                      <td className="py-3 pr-4 text-sm text-text-secondary">{f.name}</td>
                      {["free", "premium", "pro", "elite"].map((tier) => {
                        const val = f[tier as keyof typeof f];
                        return (
                          <td key={tier} className="py-3 px-4 text-center">
                            {typeof val === "boolean" ? (
                              val ? <CheckIcon /> : <MinusIcon />
                            ) : (
                              <span className="text-xs text-text-secondary">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-24 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-text-primary text-center mb-8">Frequently Asked Questions</h2>
            <Accordion
              items={faqs.map((f, i) => ({
                id: `faq-${i}`,
                title: f.q,
                content: <p className="text-sm text-text-secondary leading-relaxed">{f.a}</p>,
              }))}
            />
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-600/10 border border-primary/20 p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Ready to Master Bridge?
              </h2>
              <p className="mt-3 text-text-secondary max-w-lg mx-auto">
                Join thousands of students learning the worlds greatest card game. Start for free today.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/register">
                  <Button variant="primary" size="lg">Start Free Trial</Button>
                </Link>
                <Link href="/about">
                  <Button variant="secondary" size="lg">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </main>
  );
}
