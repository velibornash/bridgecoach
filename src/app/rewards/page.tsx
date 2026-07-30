"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RewardPopup } from "@/components/rewards/RewardPopup";
import { mockRewards, rewardItems } from "@/services/mockData";
import type { RewardType } from "@/types";
import { Icon } from "@/components/icons/Icon";
import { Coins, Zap, Star, Medal, Gift } from "lucide-react";

const typeIcons: Record<string, typeof Zap> = {
  coins: Coins, xp: Zap, stars: Star, badge: Medal, mystery_chest: Gift,
};

const rarityColors: Record<string, string> = {
  common: "border-border bg-bg-card",
  rare: "border-indigo-500/30 bg-indigo-500/5",
  epic: "border-violet-500/30 bg-violet-500/5",
  legendary: "border-amber-500/30 bg-amber-500/5",
};

export default function RewardsPage() {
  const [popup, setPopup] = useState<{ open: boolean; type: RewardType; amount: number; label: string; description: string }>({
    open: false, type: "xp", amount: 0, label: "", description: "",
  });

  const openReward = useCallback((type: RewardType, amount: number, label: string, description: string) => {
    setPopup({ open: true, type, amount, label, description });
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Rewards</h1>
            <p className="text-sm text-text-tertiary mt-1">All your earnings, collectibles, and achievements in one place.</p>
          </div>

          {/* Wallet cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {rewardItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => openReward(item.type, item.amount, item.label, item.description)}
                className="rounded-xl border border-border bg-bg-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
                <div className="text-lg font-bold text-text-primary">{item.amount.toLocaleString()}</div>
                <div className="text-[10px] text-text-tertiary">{item.label}</div>
              </motion.button>
            ))}
          </div>

          {/* Reward history */}
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-text-primary">History</h2>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {mockRewards.map((reward, i) => (
                <motion.div
                  key={reward.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01] ${rarityColors[reward.rarity] || rarityColors.common}`}
                  onClick={() => openReward(reward.type, reward.amount, reward.label, reward.description)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-secondary text-lg">
                      {typeIcons[reward.type]
                        ? <Icon icon={typeIcons[reward.type]} size={18} />
                        : <Icon icon={Gift} size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{reward.label}</span>
                        <Badge variant={reward.rarity === "legendary" ? "premium" : reward.rarity === "epic" ? "warning" : "default"}>
                          {reward.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5">{reward.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-warning">+{reward.amount}</div>
                      <div className="text-[10px] text-text-tertiary">{reward.earnedAt}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Container>
      </main>
      <RewardPopup
        open={popup.open}
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
        type={popup.type}
        amount={popup.amount}
        label={popup.label}
        description={popup.description}
      />
    </div>
  );
}