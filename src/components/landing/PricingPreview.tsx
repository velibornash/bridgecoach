"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import Link from "next/link";

/**
 * One plan, because there is one.
 *
 * This is a second copy of the pricing that `/pricing` used to carry, on the
 * HOMEPAGE, and it was missed by the earlier pass that rewrote the pricing page.
 * It sold $9 Premium and $99 Lifetime, promised "All 200+ lessons" on an
 * application with eight, and advertised "Start Free Trial" and "Partner
 * matching" for features that do not exist.
 *
 * A visitor landing on the homepage met the invented version first and the
 * corrected one only if they went looking for it, which makes this the more
 * consequential of the two — and it survived a pass that specifically went
 * looking for exactly this. Searching for the prices I had removed would have
 * caught it; checking the component the page imports would have caught it
 * sooner.
 *
 * Keep this in step with `/pricing` by having both read the same source rather
 * than by remembering to update two files.
 */
const plans = [
  {
    name: "Everything",
    price: "$0",
    period: "forever",
    description: "The whole application, at no cost, while it is in beta.",
    features: [
      "Every lesson in the catalogue",
      "Server-graded quizzes",
      "Bidding practice with a real engine",
      "Hand replay and analysis",
      "XP, levels, streaks and achievements",
      "AI coach (bring your own key)",
      "Leaderboard, friends and community",
    ],
    cta: "Create an account",
    variant: "primary" as const,
    highlight: true,
  },
];

/** Not built, listed so the absence reads as a decision rather than an omission. */
const notYetBuilt = [
  "Paid tiers and payment processing",
  "Email delivery outside development",
  "Live tournaments and expert analysis",
];

export function PricingPreview() {
  return (
    <section id="pricing" className="border-t border-border py-24 sm:py-32">
      <Container>
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Everything is free while Bridge Coach is in beta, and there is no
            checkout. Nothing is charged and no card details are collected.
          </p>
        </AnimatedSection>

        <div className="mt-16 mx-auto grid max-w-2xl gap-8">
          {plans.map((plan, i) => (
            <AnimatedSection key={plan.name} delay={i * 0.1}>
              <Card
                className={`relative flex h-full flex-col transition-all duration-150 ${
                  plan.highlight
                    ? "border-primary/50 shadow-glow"
                    : "hover:border-border-hover"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="premium">Most Popular</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-text-primary">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                    <span className="text-sm text-text-tertiary">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-text-secondary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/register" className="w-full">
                  <Button variant={plan.variant} size="lg" className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </Container>
        <AnimatedSection delay={0.2}>
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-bg-card p-5">
            <h3 className="text-sm font-semibold text-text-primary">
              Not built yet
            </h3>
            <p className="mt-1 text-xs text-text-tertiary">
              Listed so the absence is deliberate rather than looking like an
              oversight. None of it is sold or promised anywhere on this site.
            </p>
            <ul className="mt-3 space-y-1.5">
              {notYetBuilt.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-text-secondary">
                  <span className="text-text-tertiary" aria-hidden>
                    &mdash;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>
    </section>
  );
}
