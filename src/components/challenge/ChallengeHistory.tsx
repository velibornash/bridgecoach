"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { mockDailyChallengeHistory } from "@/services/mockData";
import type { DailyChallengeData } from "@/types";

const typeIcons: Record<string, string> = {
  quiz: "🧪",
  puzzle: "🧩",
  practice: "📝",
  streak: "🔥",
};

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-rose-400",
};

export function ChallengeHistory() {
  const history = mockDailyChallengeHistory;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Past Challenges</h3>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {history.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2.5 transition-all",
              c.completed ? "bg-success-light/30" : "bg-bg-secondary/30"
            )}
          >
            <span className="text-lg shrink-0">{typeIcons[c.type] || "📌"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-text-primary truncate">{c.title}</p>
                <span className={`text-[10px] font-medium shrink-0 ${difficultyColors[c.difficulty]}`}>
                  {c.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-text-tertiary">{c.date}</span>
                {c.completed && (
                  <span className="text-[10px] text-success">Completed</span>
                )}
                {!c.completed && (
                  <span className="text-[10px] text-danger">Missed</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-warning">+{c.xpReward}</p>
              {c.bonusXp > 0 && (
                <p className="text-[10px] text-text-tertiary">+{c.bonusXp} bonus</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
