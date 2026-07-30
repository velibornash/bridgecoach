"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { getLevelInfo, getXpSourceInfo, getDailyXpTotal, getWeeklyXpTotal, getDailyXpGoal, getWeeklyXpGoal } from "@/services/xpService";
import { mockUser, mockXpEntries } from "@/services/mockData";

export function XPProgress() {
  const entries = mockXpEntries;
  const levelInfo = getLevelInfo(mockUser.xp);
  const dailyTotal = getDailyXpTotal(entries);
  const weeklyTotal = getWeeklyXpTotal(entries);
  const dailyGoal = getDailyXpGoal();
  const weeklyGoal = getWeeklyXpGoal();

  const sourceTotals = entries.reduce((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Level card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Lv</div>
              <div className="text-2xl font-black text-white">{levelInfo.level}</div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">{levelInfo.title}</h2>
              <span className="text-xs rounded-full bg-bg-secondary px-2 py-0.5 text-text-tertiary font-mono">
                {mockUser.xp.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-2">
              <Progress
                value={((mockUser.xp - levelInfo.minXp) / (levelInfo.maxXp - levelInfo.minXp)) * 100}
                showLabel
              />
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              {(levelInfo.maxXp - mockUser.xp).toLocaleString()} XP to Level {levelInfo.level + 1}
            </p>
          </div>
        </div>
      </Card>

      {/* Daily / Weekly / Lifetime */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Daily XP", total: dailyTotal, goal: dailyGoal, icon: "☀️",
            gradient: "from-amber-500 to-orange-600",
          },
          {
            label: "Weekly XP", total: weeklyTotal, goal: weeklyGoal, icon: "📅",
            gradient: "from-blue-500 to-indigo-600",
          },
          {
            label: "Lifetime XP", total: mockUser.xp, goal: mockUser.xpToNextLevel, icon: "⚡",
            gradient: "from-violet-500 to-purple-600",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{stat.icon}</span>
                <span className={`text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient}`}>
                  {stat.total >= stat.goal ? "Complete" : `${stat.total}/${stat.goal}`}
                </span>
              </div>
              <p className="text-xl font-bold text-text-primary">{stat.total.toLocaleString()}</p>
              <p className="text-[11px] text-text-tertiary">{stat.label}</p>
              <div className="mt-2">
                <Progress value={(stat.total / stat.goal) * 100} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* XP by source */}
      <Card>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">XP by Source</h3>
        <div className="space-y-3">
          {Object.entries(sourceTotals).map(([source, total]) => {
            const info = getXpSourceInfo(source as any);
            const pct = (total / mockUser.xp) * 100;
            return (
              <div key={source}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={info.color}>{info.label}</span>
                  <span className="text-text-secondary font-mono">+{total} XP ({Math.round(pct)}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-current opacity-60"
                    style={{ color: info.color.replace("text-", "") }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent XP entries */}
      <Card>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {entries.slice(0, 8).map((entry) => {
            const info = getXpSourceInfo(entry.source);
            const date = new Date(entry.timestamp);
            const isToday = new Date().toDateString() === date.toDateString();
            const timeStr = isToday
              ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-bg-secondary/30 p-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${info.color.replace("text-", "bg-").replace("400", "500/10")}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={info.color}>
                    <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary truncate">{entry.description}</p>
                  <p className="text-[10px] text-text-tertiary">{timeStr}</p>
                </div>
                <span className={`text-xs font-semibold ${info.color}`}>+{entry.amount}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
