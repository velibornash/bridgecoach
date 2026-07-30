"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { MissionSection } from "@/components/missions/MissionSection";
import { mockMissions } from "@/services/mockData";
import type { MissionCategory } from "@/types";

export default function MissionsPage() {
  const [activeTab, setActiveTab] = useState<MissionCategory>("daily");
  const [missions, setMissions] = useState(mockMissions);

  const daily = missions.filter((m) => m.category === "daily");
  const weekly = missions.filter((m) => m.category === "weekly");

  const handleComplete = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: true } : m)),
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Missions</h1>
            <p className="text-sm text-text-tertiary mt-1">
              Complete missions to earn bonus XP and track your progress.
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl bg-bg-card border border-border p-1 mb-8">
            {(["daily", "weekly"] as const).map((tab) => {
              const items = tab === "daily" ? daily : weekly;
              const done = items.filter((m) => m.completed).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  <Badge variant="default">
                    {done}/{items.length}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Mission list */}
          <AnimatePresence mode="wait">
            {activeTab === "daily" ? (
              <MissionSection key="daily" missions={daily} category="daily" />
            ) : (
              <MissionSection key="weekly" missions={weekly} category="weekly" />
            )}
          </AnimatePresence>

          {/* Empty state */}
          {activeTab === "daily" && daily.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                  <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                </svg>
              </div>
              <p className="text-sm text-text-tertiary">No daily missions available.</p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}