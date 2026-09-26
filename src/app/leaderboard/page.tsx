"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import {
  fetchLeaderboard,
  type LeaderboardData,
  type LeaderboardEntry,
  type LeaderboardScope,
  type LeaderboardPeriod,
} from "@/services/leaderboardService";
import { useApiResource } from "@/hooks/useApiResource";
import { Icon } from "@/components/icons/Icon";
import { Award, Medal } from "lucide-react";
import Link from "next/link";

const tabs = [
  { label: "Global", scope: "global", period: "all" },
  { label: "Country", scope: "country", period: "all" },
  { label: "Weekly", scope: "global", period: "weekly" },
  { label: "Monthly", scope: "global", period: "monthly" },
] as const satisfies readonly { label: string; scope: LeaderboardScope; period: LeaderboardPeriod }[];

const displayName = (e: LeaderboardEntry) => `${e.firstName} ${e.lastName}`.trim();

function getMedal(rank: number) {
  if (rank === 1) return { icon: Award, color: "text-yellow-400" };
  if (rank === 2) return { icon: Medal, color: "text-gray-300" };
  if (rank === 3) return { icon: Medal, color: "text-amber-600" };
  return null;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState(0);
  const active = tabs[tab];

  // Real players from the database (Sprint 59). The Sprint 58 version rendered a
  // fixture of ten invented competitors, which is why this page carried a
  // "sample data" notice: a rank against people who do not exist is not a low
  // rank, it is a false statement about the player's standing.
  const { data, loading, error } = useApiResource<LeaderboardData>(
    () => fetchLeaderboard(active.scope, active.period),
    [active.scope, active.period],
  );
  const filtered = data?.entries ?? [];

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Leaderboard</h1>

          <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none">
            {tabs.map((t, index) => (
              <button
                key={t.label}
                onClick={() => setTab(index)}
                className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  tab === index ? "bg-primary text-white" : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {t.label}
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
                    <Avatar name={displayName(e)} size={isGold ? "md" : "sm"} />
                  </div>
                  <p className={`font-bold text-text-primary truncate ${isGold ? "text-sm" : "text-xs"}`}>{displayName(e)}</p>
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

          {loading ? (
            <p className="py-10 text-center text-sm text-text-tertiary">Loading the leaderboard…</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-error">{error}</p>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-text-secondary">
                {data?.period && data.period !== "all"
                  ? `No players earned XP ${data.period === "weekly" ? "this week" : "this month"} yet.`
                  : "No players to rank yet."}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                Complete a lesson or drill to be the first on this board.
              </p>
            </div>
          ) : (
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

                  <Avatar name={displayName(e)} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary truncate">{displayName(e)}</p>
                      {e.isCurrentUser && (
                        <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">You</span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-tertiary">
                      Level {e.level} · {e.xp.toLocaleString()} XP · {e.country}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {(e.periodXp ?? e.xp).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          )}
        </Container>
        {data && data.currentUserRank !== null && !data.entries.some((e) => e.isCurrentUser) && (
          <p className="mt-5 text-center text-xs text-text-tertiary">
            Your rank: <span className="font-semibold text-text-secondary">#{data.currentUserRank}</span>{" "}
            of {data.totalPlayers} {data.totalPlayers === 1 ? "player" : "players"}
          </p>
        )}
      </main>
    </div>
  );
}
