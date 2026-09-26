"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Badge } from "@/components/ui/Badge";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";

export function WelcomeHeader() {
  const { data } = useDashboardData();
  return (
    <AnimatedSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              Welcome back, {data?.user.firstName ?? "there"}
            </h1>
            <Badge variant="primary">Level {data?.progression.level ?? 1}</Badge>
          </div>
          <p className="mt-1 text-text-secondary">
            Ready to improve your bridge game?
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
