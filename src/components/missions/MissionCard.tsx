"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import type { Mission } from "@/types";

interface MissionCardProps {
  mission: Mission;
  index: number;
  onComplete?: (id: string) => void;
}

const typeConfig: Record<string, { label: string; className: string }> = {
  main: { label: "Main", className: "bg-primary/20 text-primary border-primary/30" },
  side: { label: "Side", className: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  bonus: { label: "Bonus", className: "bg-warning/20 text-warning border-warning/30" },
};

export function MissionCard({ mission, index, onComplete }: MissionCardProps) {
  const [showReward, setShowReward] = useState(false);

  const handleClaim = () => {
    setShowReward(true);
    setTimeout(() => {
      onComplete?.(mission.id);
      setShowReward(false);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
        mission.completed
          ? "border-success/30 bg-success/5"
          : "border-border bg-bg-card hover:border-primary/20"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${mission.gradient}`}
          >
            <span className="text-lg">{mission.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className={`text-sm font-bold ${mission.completed ? "text-text-tertiary line-through" : "text-text-primary"}`}>
                {mission.title}
              </h3>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-medium border ${typeConfig[mission.type]?.className || "border-border text-text-tertiary"}`}>
                {typeConfig[mission.type]?.label || mission.type}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mb-3">{mission.description}</p>

            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-tertiary">{mission.progress}/{mission.maxProgress}</span>
              <span className="text-warning font-medium">+{mission.xpReward} XP</span>
            </div>
            <Progress
              value={Math.round((mission.progress / mission.maxProgress) * 100)}
              max={100}
            />
          </div>
        </div>

        {/* Action */}
        <div className="mt-3 flex justify-end">
          {mission.completed ? (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Completed
            </div>
          ) : mission.progress >= mission.maxProgress ? (
            <Button variant="primary" size="sm" onClick={handleClaim}>
              Claim Reward
            </Button>
          ) : (
            <span className="text-[10px] text-text-tertiary">
              {mission.maxProgress - mission.progress} remaining
            </span>
          )}
        </div>
      </div>

      {/* Reward animation overlay */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-card/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.5 }}
                className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-warning/20"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                  <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                </svg>
              </motion.div>
              <p className="text-sm font-bold text-text-primary">+{mission.xpReward} XP</p>
              <p className="text-xs text-text-tertiary mt-0.5">Mission Complete!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}