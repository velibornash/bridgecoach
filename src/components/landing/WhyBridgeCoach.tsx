"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

const reasons = [
  {
    number: "01",
    title: "Learn by Playing",
    description: "Bridge isn't a spectator sport. Every lesson puts you at the table with real-time feedback on every bid and card you play.",
  },
  {
    number: "02",
    title: "Curriculum That Adapts",
    description: "The platform tracks your strengths and weaknesses, serving the right lesson at the right time — just like a private tutor.",
  },
  {
    number: "03",
    title: "Built by Players, for Players",
    description: "Created by tournament-level players and educators who understand exactly what it takes to go from beginner to competent.",
  },
  {
    number: "04",
    title: "Gamified Progress",
    description: "XP, streaks, achievements, and a visual learning path turn the climb from novice to expert into an addictive game.",
  },
];

export function WhyBridgeCoach() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <Container>
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Why Bridge Coach?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Because traditional bridge learning is broken. We fixed it.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {reasons.map((reason, i) => (
            <AnimatedSection key={reason.number} delay={i * 0.1}>
              <Card className="group relative h-full transition-all duration-150 hover:border-border-hover hover:shadow-md">
                <span className="text-5xl font-black leading-none text-bg-secondary transition-colors group-hover:text-primary/20">
                  {reason.number}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-text-primary">
                  {reason.title}
                </h3>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  {reason.description}
                </p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </Container>
    </section>
  );
}
