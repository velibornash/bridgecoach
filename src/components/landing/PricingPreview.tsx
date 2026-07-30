"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start your bridge journey with solid fundamentals.",
    features: [
      "First 10 lessons",
      "Basic quizzes",
      "Daily challenges",
      "XP tracking",
      "Community access",
    ],
    cta: "Start Free",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Premium",
    price: "$9",
    period: "/month",
    description: "The complete learning experience. Cancel anytime.",
    features: [
      "All 200+ lessons",
      "Advanced quizzes",
      "AI Coach feedback",
      "Unlimited daily challenges",
      "Achievement system",
      "Partner matching",
      "Priority support",
    ],
    cta: "Start Free Trial",
    variant: "primary" as const,
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$99",
    period: "one-time",
    description: "One payment. Lifetime access. Forever updates.",
    features: [
      "Everything in Premium",
      "Future content updates",
      "Early access to features",
      "Exclusive community role",
      "Beta features",
    ],
    cta: "Get Lifetime",
    variant: "outline" as const,
    highlight: false,
  },
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
            Start free. Upgrade when you are ready. No hidden fees.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
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
    </section>
  );
}
