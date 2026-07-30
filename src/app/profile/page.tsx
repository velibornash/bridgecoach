"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { mockUser, mockUserStats, mockAchievements, mockCertificates, mockLessons, mockActivity } from "@/services/mockData";

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", NZ: "🇳🇿", IE: "🇮🇪",
};

const experienceLabels: Record<string, string> = {
  new: "New to Bridge",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function ProfilePage() {
  const name = `${mockUser.firstName} ${mockUser.lastName}`;
  const unlockedAchievements = mockAchievements.filter((a) => a.unlocked);
  const bookmarked = mockLessons.filter((l) => l.bookmarked);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container className="max-w-3xl">
          {/* Profile Header */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative shrink-0">
                <Avatar name={name} size="xl" />
                <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-text-primary">{name}</h1>
                  <span className="text-lg">{countryFlags[mockUser.country] || "🌍"}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="primary">Level {mockUser.level}</Badge>
                  <Badge variant="warning">🔥 {mockUser.streak}-day streak</Badge>
                  <span className="text-xs text-text-tertiary">{experienceLabels[mockUser.experienceLevel]}</span>
                </div>
                <p className="mt-1 text-xs text-text-tertiary">
                  Member since {new Date(mockUser.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* XP Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-secondary">XP Progress</span>
                <span className="text-text-primary font-mono font-medium">{mockUser.xp.toLocaleString()} / {mockUser.xpToNextLevel.toLocaleString()}</span>
              </div>
              <Progress value={(mockUser.xp / mockUser.xpToNextLevel) * 100} />
              <p className="mt-1 text-[11px] text-text-tertiary text-right">
                {(mockUser.xpToNextLevel - mockUser.xp).toLocaleString()} XP to Level {mockUser.level + 1}
              </p>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Lessons Done", value: `${mockUserStats.completedLessons}/${mockUserStats.totalLessons}`, icon: "📖", color: "from-blue-500 to-indigo-600" },
                { label: "Avg Score", value: `${mockUserStats.averageScore}%`, icon: "🎯", color: "from-emerald-500 to-teal-600" },
                { label: "Total XP", value: mockUserStats.totalXpEarned.toLocaleString(), icon: "⚡", color: "from-amber-500 to-orange-600" },
                { label: "Streak", value: `${mockUserStats.longestStreak} days`, icon: "🔥", color: "from-rose-500 to-pink-600" },
                { label: "Hours Learned", value: mockUserStats.totalHours, icon: "⏱️", color: "from-violet-500 to-purple-600" },
                { label: "Cards Played", value: mockUserStats.cardsPlayed.toLocaleString(), icon: "🃏", color: "from-cyan-500 to-blue-600" },
                { label: "Bid Accuracy", value: `${Math.round((mockUserStats.correctBids / mockUserStats.totalBids) * 100)}%`, icon: "📊", color: "from-lime-500 to-green-600" },
                { label: "Days Active", value: mockUserStats.daysActive, icon: "📅", color: "from-sky-500 to-indigo-600" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-bg-card p-3.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{stat.icon}</span>
                    <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${stat.color}`} />
                  </div>
                  <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                  <p className="text-[11px] text-text-tertiary">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Achievements</h2>
              <span className="text-xs text-text-tertiary">{unlockedAchievements.length}/{mockAchievements.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mockAchievements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3.5 transition-all ${
                    a.unlocked ? "border-border bg-bg-card" : "border-border/50 bg-bg-card/30 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xl ${a.unlocked ? "" : "grayscale"}`}>{a.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${a.unlocked ? "text-text-primary" : "text-text-tertiary"}`}>
                        {a.title}
                      </p>
                      <p className="text-[10px] text-text-tertiary truncate">{a.description}</p>
                    </div>
                  </div>
                  {a.unlocked && a.unlockedAt && (
                    <p className="mt-1.5 text-[10px] text-text-tertiary/60">
                      Earned {new Date(a.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Certificates */}
          {mockCertificates.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Certificates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={`rounded-xl border border-border bg-gradient-to-br ${cert.gradient} p-4 relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full" />
                    <div className="relative">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mb-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-white">{cert.title}</h3>
                      <p className="text-xs text-white/70 mt-0.5">{cert.description}</p>
                      <p className="text-[10px] text-white/50 mt-2">
                        Earned {new Date(cert.earnedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookmarked Lessons */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Favorite Lessons</h2>
            {bookmarked.length === 0 ? (
              <p className="text-xs text-text-tertiary italic">No bookmarked lessons yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bookmarked.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-warning">
                        <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{l.title}</p>
                      <p className="text-[11px] text-text-tertiary">{l.duration} · {l.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="mt-6 mb-8">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Learning History</h2>
            <div className="space-y-2">
              {mockActivity.map((act) => (
                <div key={act.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    act.type === "lesson" ? "bg-primary/10" :
                    act.type === "quiz" ? "bg-emerald-500/10" :
                    act.type === "achievement" ? "bg-amber-500/10" :
                    act.type === "streak" ? "bg-rose-500/10" : "bg-violet-500/10"
                  }`}>
                    {act.type === "lesson" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
                    {act.type === "quiz" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>}
                    {act.type === "achievement" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.023 6.023 0 01-2.77-.896" /></svg>}
                    {act.type === "streak" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400"><path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>}
                    {act.type === "xp" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{act.description}</p>
                    <p className="text-[10px] text-text-tertiary">{act.timestamp}</p>
                  </div>
                  {act.xp && (
                    <span className="text-[11px] font-semibold text-warning shrink-0">+{act.xp} XP</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
