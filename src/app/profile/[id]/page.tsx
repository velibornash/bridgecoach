"use client";

import { use, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { mockPublicProfiles, mockUser, mockAchievements } from "@/services/mockData";

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", NZ: "🇳🇿", IE: "🇮🇪",
  RS: "🇷🇸", HR: "🇭🇷", ES: "🇪🇸", KR: "🇰🇷", CN: "🇨🇳", FR: "🇫🇷", IT: "🇮🇹", JP: "🇯🇵", AE: "🇦🇪",
};

const experienceLabels: Record<string, string> = {
  new: "New to Bridge",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const typeIcons: Record<string, string> = {
  lesson: "📖", quiz: "🧪", achievement: "🏆", xp: "⚡", streak: "🔥",
};

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const profile = useMemo(() => mockPublicProfiles[id] ?? null, [id]);
  const isOwn = id === mockUser.id;

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <DashboardHeader />
        <main className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-secondary">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-sm text-text-tertiary">Profile not found.</p>
        </main>
      </div>
    );
  }

  const { user, stats, activity } = profile;
  const unlockedAch = mockAchievements.filter((a) => a.unlocked);
  const xpPercent = (user.xp / user.xpToNextLevel) * 100;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-3xl">
          <motion.div variants={container} initial="hidden" animate="show">
            {/* Header card */}
            <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -mr-16 -mt-16" />
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-xl font-bold text-text-primary">{user.firstName} {user.lastName}</h1>
                    {isOwn && <Badge variant="primary">You</Badge>}
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                    <span className="text-xs text-text-tertiary">{countryFlags[user.country] || "🌍"} {user.country}</span>
                    <span className="text-text-tertiary">·</span>
                    <span className="text-xs text-text-tertiary">{experienceLabels[user.experienceLevel]}</span>
                    <span className="text-text-tertiary">·</span>
                    <span className="text-xs font-semibold text-primary">Level {user.level}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">Joined {user.joinedAt} · {user.streak}-day streak 🔥</p>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-2xl font-bold text-text-primary">{user.xp.toLocaleString()}</div>
                  <div className="text-[10px] text-text-tertiary">Total XP</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-tertiary">Level {user.level}</span>
                  <span className="text-text-secondary">{user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP</span>
                </div>
                <Progress value={xpPercent} />
              </div>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Stats grid */}
              <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-5">
                <h2 className="text-sm font-bold text-text-primary mb-4">Statistics</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Lessons Done", value: stats.completedLessons, icon: "📖", color: "text-emerald-400" },
                    { label: "Avg Score", value: `${stats.averageScore}%`, icon: "🎯", color: "text-amber-400" },
                    { label: "Total XP", value: stats.totalXpEarned.toLocaleString(), icon: "⚡", color: "text-primary" },
                    { label: "Hours Learned", value: stats.totalHours, icon: "⏱", color: "text-indigo-400" },
                    { label: "Streak", value: `${stats.longestStreak} days`, icon: "🔥", color: "text-orange-400" },
                    { label: "Cards Played", value: stats.cardsPlayed.toLocaleString(), icon: "🃏", color: "text-violet-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-bg-secondary p-3 text-center">
                      <div className={`text-lg ${s.color}`}>{s.icon}</div>
                      <div className="text-sm font-bold text-text-primary mt-0.5">{s.value}</div>
                      <div className="text-[9px] text-text-tertiary">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Achievements */}
              <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-5">
                <h2 className="text-sm font-bold text-text-primary mb-4">Achievements ({unlockedAch.length})</h2>
                <div className="space-y-2">
                  {unlockedAch.slice(0, 6).map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <span className="text-lg">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{a.title}</p>
                        <p className="text-[10px] text-text-tertiary">{a.unlockedAt}</p>
                      </div>
                      <Badge variant={a.rarity === "legendary" ? "warning" : a.rarity === "epic" ? "primary" : "default"}>
                        {a.rarity}
                      </Badge>
                    </div>
                  ))}
                  {unlockedAch.length === 0 && (
                    <p className="text-xs text-text-tertiary">No achievements yet.</p>
                  )}
                </div>
                {unlockedAch.length > 6 && (
                  <Link href="/achievements" className="block text-center text-xs text-primary mt-3 hover:underline">
                    View all {unlockedAch.length} achievements
                  </Link>
                )}
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-5 sm:col-span-2">
                <h2 className="text-sm font-bold text-text-primary mb-4">Recent Activity</h2>
                <div className="space-y-2">
                  {activity.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-1.5">
                      <span className="text-base">{typeIcons[a.type] || "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary truncate">{a.description}</p>
                        <p className="text-[10px] text-text-tertiary">{a.timestamp}</p>
                      </div>
                      {a.xp && <span className="shrink-0 text-[10px] font-medium text-primary">+{a.xp} XP</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
