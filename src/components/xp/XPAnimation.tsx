"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface XPAnimationItem {
  id: number;
  amount: number;
  x: number;
}

let addXpFn: ((amount: number) => void) | null = null;

export function triggerXpAnimation(amount: number) {
  addXpFn?.(amount);
}

export function XPOverlay() {
  const [items, setItems] = useState<XPAnimationItem[]>([]);

  const addXp = useCallback((amount: number) => {
    const id = Date.now();
    const x = (Math.random() - 0.5) * 120;
    setItems((prev) => [...prev, { id, amount, x }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 1200);
  }, []);

  useEffect(() => {
    addXpFn = addXp;
    return () => { addXpFn = null; };
  }, [addXp]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, x: item.x, scale: 0.5 }}
            animate={{ opacity: 0, y: -120, x: item.x + 20, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute bottom-1/2 left-1/2"
          >
            <div className="flex items-center gap-1.5 rounded-full bg-warning/15 backdrop-blur-sm border border-warning/30 px-3 py-1.5 shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-sm font-bold text-warning">+{item.amount}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
