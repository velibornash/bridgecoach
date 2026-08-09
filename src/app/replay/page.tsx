"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HandReplayer } from "@/components/replayEngine/HandReplayer";

export default function ReplayPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Hand Replayer</span>
          </div>
          <h1 className="text-heading text-text-primary mb-2">Replay &amp; Review</h1>
          <p className="text-sm text-text-tertiary mb-6">
            Step through expert-played hands, one card at a time, with coach annotations on every move.
          </p>
          <HandReplayer />
        </Container>
      </main>
    </div>
  );
}
