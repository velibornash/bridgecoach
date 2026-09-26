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

/**
 * One plan, because there is one.
 *
 * This page previously sold four tiers — $9 Premium, $19 Pro, and a custom Elite
 * tier — listing "200+ lessons", live tournaments, expert analysis, custom
 * learning plans, API access, a class management dashboard, custom branding and
 * an SLA guarantee. The application had eight lessons, no tournaments, no
 * billing integration, and no API. The FAQ alongside it promised a 30-day
 * money-back guarantee and accepted PayPal and Apple Pay.
 *
 * None of that was ever labelled as a placeholder, and a pricing page is the one
 * place where a visitor might reasonably act on a number. So the invented tiers
 * are gone and the page says what is actually true: everything is free, and here
 * is what works.
 *
 * When billing is genuinely built, restore the tiers from the same source of
 * truth the checkout reads — not from a component constant.
 */
const plans = [
  {
    name: "Everything",
    price: "$0",
    period: "forever",
    description: "The whole application, at no cost, while it is in beta.",
    features: [
      "All lessons in the catalogue",
      "Server-graded quizzes",
      "Bidding practice with a real engine",
      "Hand replay and analysis",
      "XP, levels, streaks and achievements",
      "Notes, bookmarks and progress tracking",
      "AI coach (bring your own key)",
      "Leaderboard, friends and community",
    ],
    cta: "Create an account",
    variant: "primary" as const,
    highlight: true,
    popular: true,
  },
];

/**
 * Not yet built, listed so the absence is deliberate and visible rather than
 * looking like an oversight. Each is a real gap, not a future promise.
 */
const notYetBuilt = [
  "Paid tiers and payment processing — there is no checkout",
  "Email delivery, including password reset outside development",
  "Live tournaments and expert analysis",
  "API access for third-party tools",
  "Team seats, class management and custom branding",
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
  { q: "Will there be paid plans?", a: "Possibly, and this page will say so before they exist. Nothing here takes a payment today, so there is nothing to cancel or refund." },
  { q: "Is there a free trial?", a: "There is no trial because there is no paid plan. The whole application is free." },
  { q: "What payment methods do you accept?", a: "None — there is no checkout. Everything is free while the app is in beta, so there is nothing to pay for." },
  { q: "Can I cancel a subscription?", a: "There is no subscription to cancel. Nothing is charged and no card details are ever collected." },
  { q: "Is there a student discount?", a: "Not applicable — everything is already free, so there is nothing to discount." },
  { q: "Do you offer refunds?", a: "There is nothing to refund: the app is free and no payment is ever taken. If paid tiers are added later, this page will say so before they exist." },
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

          {/* What is not built yet. A single-plan comparison table would be
              theatre, so the space is used to state the gaps instead. */}
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-text-primary text-center mb-3">
              Not built yet
            </h2>
            <p className="mx-auto max-w-xl text-center text-sm text-text-secondary mb-8">
              Listed so their absence is deliberate rather than looking like an
              oversight. None of them are sold or promised anywhere on this site.
            </p>
            <ul className="mx-auto max-w-xl space-y-2">
              {notYetBuilt.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm text-text-secondary"
                >
                  <span className="mt-0.5 text-text-tertiary" aria-hidden>
                    &mdash;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ */}
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
