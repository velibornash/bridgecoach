"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { CardEngine } from "@/components/cardEngine/CardEngine";
import type { Bid } from "@/components/biddingBox/BiddingBox";

interface BiddingTimelineProps {
  history: Array<{
    player: string;
    bid: Bid | null;
    timestamp: number;
  }>;
  currentPlayer?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BiddingTimeline({ history, currentPlayer, size = 'md' }: BiddingTimelineProps) {
  const playerColors: Record<string, string> = {
    north: 'text-indigo-400',
    east: 'text-emerald-400',
    south: 'text-primary',
    west: 'text-amber-400',
  };

  const playerLabels: Record<string, string> = {
    north: 'North',
    east: 'East',
    south: 'South',
    west: 'West',
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-primary">Bidding History</h3>
        {history.length > 0 && (
          <span className="text-[10px] text-text-tertiary">{history.length} bids</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M8.25 6.75h12m-12 3h12m-12 3h12m-3 3h12M6 12h.008v.008H6V12zm0 3h.008v.008H6V15zm0 3h.008v.008H6V18z" />
            </svg>
          </div>
          <p className="text-sm text-text-tertiary">No bids yet</p>
          <p className="text-xs text-text-tertiary mt-1">Waiting for the bidding to begin...</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-3">
            <AnimatePresence>
              {history.map((entry, index) => {
                const isCurrent = entry.player === currentPlayer;
                const color = playerColors[entry.player] || 'text-text-tertiary';
                const label = playerLabels[entry.player] || entry.player;

                return (
                  <motion.div
                    key={`${entry.player}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, type: "spring", damping: 20 }}
                    className={`relative flex items-start gap-3 pl-8 ${isCurrent ? 'bg-primary/5 rounded-lg -mx-2 px-2 py-1.5' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-2 top-3 h-2 w-2 rounded-full ${isCurrent ? 'bg-primary ring-2 ring-primary/30' : 'bg-border'}`} />

                    {/* Player badge */}
                    <div className={`shrink-0 w-16 text-right text-xs font-bold ${color}`}>
                      {label}
                    </div>

                    {/* Bid display */}
                    <div className="flex-1 min-w-0">
                      {entry.bid ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={isCurrent ? 'primary' : 'default'} className="text-xs">
                            {entry.bid.label}
                          </Badge>
                          <span className="text-[10px] text-text-tertiary">
                            {entry.bid.description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-tertiary italic">Pass</span>
                      )}
                    </div>

                    {/* Arrow connector */}
                    {index < history.length - 1 && (
                      <div className="absolute left-4 top-5 bottom-0 w-px bg-border -mb-3" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
