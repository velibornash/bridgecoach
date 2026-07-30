"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RewardPopupProps {
  open: boolean;
  onClose: () => void;
  type: "coins" | "xp" | "stars" | "badge" | "mystery_chest";
  amount: number;
  label: string;
  description: string;
}

const config: Record<string, { icon: string; gradient: string; sound: string }> = {
  coins: { icon: "🪙", gradient: "from-yellow-400 to-amber-600", sound: "coin" },
  xp: { icon: "⚡", gradient: "from-indigo-400 to-indigo-600", sound: "xp" },
  stars: { icon: "⭐", gradient: "from-yellow-300 to-orange-500", sound: "star" },
  badge: { icon: "🃏", gradient: "from-violet-400 to-purple-600", sound: "badge" },
  mystery_chest: { icon: "🎁", gradient: "from-rose-400 to-pink-600", sound: "chest" },
};

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 200 - 100,
  y: Math.random() * -200 - 50,
  size: Math.random() * 6 + 4,
}));

export function RewardPopup({ open, onClose, type, amount, label, description }: RewardPopupProps) {
  const c = config[type];

  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 18, stiffness: 280 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 text-center overflow-hidden"
          >
            {/* Particle burst */}
            <div className="absolute inset-0 pointer-events-none">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: 0, x: p.x * 1.5, y: p.y * 1.5, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 rounded-full bg-white/40"
                  style={{ width: p.size, height: p.size }}
                />
              ))}
            </div>

            {/* Icon */}
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.1 }}
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${c.gradient} shadow-lg`}
            >
              <span className="text-3xl">{c.icon}</span>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h3 className="text-xl font-bold text-text-primary mb-1">+{amount} {type === "coins" ? "Coins" : type === "xp" ? "XP" : type === "stars" ? "Stars" : type === "badge" ? "Badge" : "Mystery Chest"}</h3>
              <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
              <p className="text-xs text-text-tertiary">{description}</p>
            </motion.div>

            {/* Sparkle ring */}
            <motion.div
              initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 360, scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="absolute -inset-4 rounded-full border border-primary/10 pointer-events-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}