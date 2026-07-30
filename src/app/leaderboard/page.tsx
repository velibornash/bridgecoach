"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { mockLeaderboard } from "@/services/mockData";
import { mockFriends } from "@/services/mockData";
import { Icon } from "@/components/icons/Icon";
import { Award, Medal, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const tabs = ["Global", "Friends", "Country", "Weekly", "Monthly"] as const;
type Tab = (typeof tabs)[number];

function getMedal(rank: number) {
  if (rank === 1) return { icon: Award, color: "text-yellow-400" };
  if (rank === 2) return { icon: Medal, color: "text-gray-300" };
  if (rank === 3) return { icon: Medal, color: "text-amber-600" };
  return null;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("Global");

  const entries = tab === "Friends"
    ? mockLeaderboard.filter((e) => e.isFriend).map((e, i) => ({ ...e, rank: i + 1 }))
    : mockLeaderboard;

  const country = tab === "Country" ? "US" : null;
  const filtered = country ? entries.filter((e) => e.country === country) : entries;

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Leaderboard</h1>

          <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  tab === t ? "bg-primary text-white" : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 items-end">
            {[2, 1, 3].map((rank) => {
              const e = filtered.find((x) => x.rank === rank);
              if (!e) return <div key={rank} />;
              const isGold = rank === 1;
              return (
                <div
                  key={e.userId}
                  className={`rounded-xl border text-center p-4 transition-all ${
                    e.isCurrentUser ? "border-primary/40 bg-primary/5" : "border-border bg-bg-card"
                  } ${isGold ? "scale-105" : ""}`}
                >
                  <div className={`text-2xl mb-1 flex justify-center ${isGold ? "scale-125" : ""}`}>
                    <Icon icon={Award} size={32} className={getMedal(rank)?.color} />
                  </div>
                  <div className="flex justify-center mb-1.5">
                    <Avatar name={e.name} size={isGold ? "md" : "sm"} />
                  </div>
                  <p className={`font-bold text-text-primary truncate ${isGold ? "text-sm" : "text-xs"}`}>{e.name}</p>
                  <p className="text-[10px] text-text-tertiary">
                    Lvl {e.level} · {e.xp.toLocaleString()} XP
                  </p>
                  {e.isCurrentUser && (
                    <span className="inline-block mt-1 rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-medium text-primary">
                      You
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filtered.map((e) => (
                <motion.div
                  key={e.userId}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    e.isCurrentUser ? "bg-primary/5 border border-primary/20" : "bg-bg-card border border-transparent hover:bg-bg-secondary"
                  }`}
                >
                  <div className="w-8 text-center shrink-0">
                    {getMedal(e.rank) ? (
                      <Icon icon={getMedal(e.rank)!.icon} size={18} className={getMedal(e.rank)!.color} />
                    ) : (
                      <span className="text-sm font-bold text-text-tertiary">#{e.rank}</span>
                    )}
                  </div>

                  <Avatar name={e.name} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary truncate">{e.name}</p>
                      {e.isCurrentUser && (
                        <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">You</span>
                      )}
                      {e.isFriend && !e.isCurrentUser && (
                        <span className="shrink-0 text-[10px] text-text-tertiary flex items-center gap-0.5">
                          <Icon icon={Award} size={8} className="text-warning" /> Friend
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-tertiary">
                      Level {e.level} · {e.xp.toLocaleString()} XP · {e.country}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {e.xp.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
}
