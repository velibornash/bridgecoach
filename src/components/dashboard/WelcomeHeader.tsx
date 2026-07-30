"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Badge } from "@/components/ui/Badge";
import { mockUser } from "@/services/mockData";

export function WelcomeHeader() {
  return (
    <AnimatedSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              Welcome back, {mockUser.firstName}
            </h1>
            <Badge variant="primary">Level {mockUser.level}</Badge>
          </div>
          <p className="mt-1 text-text-secondary">
            Ready to improve your bridge game?
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
