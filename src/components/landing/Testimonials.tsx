"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/ui/Avatar";
import { mockTestimonials } from "@/services/mockData";

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="border-t border-border py-24 sm:py-32">
      <Container>
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            What Our Learners Say
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Real stories from real bridge players.
          </p>
        </AnimatedSection>

        <div className="mt-16 mx-auto max-w-2xl">
          <div className="relative min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="text-center">
                  <svg className="mx-auto mb-6 h-8 w-8 text-primary/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.402-.62-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.402-.62-2.917-1.179z" />
                  </svg>
                  <p className="text-lg leading-relaxed text-text-secondary">
                    &ldquo;{mockTestimonials[active].content}&rdquo;
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Avatar name={mockTestimonials[active].name} size="md" />
                    <div className="text-left">
                      <div className="font-semibold text-text-primary">
                        {mockTestimonials[active].name}
                      </div>
                      <div className="text-sm text-text-tertiary">
                        {mockTestimonials[active].role}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {mockTestimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-8 bg-primary"
                    : "w-2 bg-bg-secondary hover:bg-bg-secondary/80"
                }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
