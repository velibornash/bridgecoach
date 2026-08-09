"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  Brain,
  ChevronRight,
  Sparkles,
  Share2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CardEngine } from "@/components/cardEngine/CardEngine";

interface ReplayAction {
  player: "North" | "East" | "South" | "West";
  action: string; // e.g. "♠A" or "Pass"
  explanation?: string;
  isBestPlay?: boolean;
}

interface ReplayScenario {
  id: string;
  title: string;
  contract: string;
  declarer: string;
  actions: ReplayAction[];
}

const mockReplayScenario: ReplayScenario = {
  id: "rs1",
  title: "Opening Lead Defense Replay",
  contract: "4♠ by South",
  declarer: "South",
  actions: [
    { player: "West", action: "♥K", explanation: "Standard lead from King-Queen sequence.", isBestPlay: true },
    { player: "North", action: "♥2", explanation: "Follows suit with low heart from dummy.", isBestPlay: true },
    { player: "East", action: "♥7", explanation: "Encouraging signal, showing partner interest.", isBestPlay: true },
    { player: "South", action: "♥A", explanation: "South wins with the Ace, retaining control.", isBestPlay: true },
    { player: "South", action: "♠Q", explanation: "South attempts a trump drawing lead.", isBestPlay: false },
    { player: "West", action: "♠K", explanation: "West makes a smart play to hold and cover.", isBestPlay: true }
  ]
};

export function HandReplayer() {
  const [scenario] = useState<ReplayScenario>(mockReplayScenario);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentIndex < scenario.actions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, scenario.actions.length]);

  const stepForward = () => {
    setCurrentIndex(prev => Math.min(scenario.actions.length - 1, prev + 1));
  };

  const stepBackward = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const resetReplay = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const currentAction = scenario.actions[currentIndex];

  return (
    <GlassCard variant="premium" hover={false} className="p-6 my-6 border-indigo-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon icon={Sparkles} className="text-primary animate-pulse" size={18} />
            <h3 className="text-base font-bold text-text-primary">{scenario.title}</h3>
          </div>
          <p className="text-xs text-text-tertiary">
            Contract: <span className="text-text-primary font-semibold">{scenario.contract}</span> · Declarer: <span className="text-text-primary font-semibold">{scenario.declarer}</span>
          </p>
        </div>
        <button
          onClick={() => alert("Replay link copied! Ready to share with partner.")}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-text-tertiary hover:text-text-primary transition-colors"
        >
          <Icon icon={Share2} size={14} /> Share Replay
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Playback Controls & Timeline */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-bg-secondary/40 border border-border p-3.5 rounded-xl">
            <span className="text-xs font-bold text-text-secondary uppercase">Trick History</span>
            <span className="text-xs font-mono text-text-tertiary font-bold">{currentIndex + 1} / {scenario.actions.length}</span>
          </div>

          {/* Action timeline list */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {scenario.actions.map((act, idx) => {
              const isActive = idx === currentIndex;
              const isPast = idx < currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
                  className={cn(
                    "w-full text-left rounded-xl p-3 text-xs transition-all flex items-center justify-between border",
                    isActive
                      ? "border-primary bg-primary/10 font-semibold text-text-primary"
                      : isPast
                        ? "border-success/15 bg-success/5 text-text-secondary"
                        : "border-transparent bg-transparent text-text-tertiary hover:bg-bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isActive ? "bg-primary animate-ping" : isPast ? "bg-success" : "bg-border"
                    )} />
                    <span className="font-bold w-12">{act.player}:</span>
                    <span>Played {act.action}</span>
                  </div>
                  {act.isBestPlay && isPast && (
                    <Icon icon={CheckCircle2} size={12} className="text-success" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Core Navigation Bar */}
          <div className="flex items-center justify-center gap-3 bg-bg-secondary/30 border border-border/80 p-3 rounded-xl">
            <button
              onClick={resetReplay}
              className="p-2 text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
              title="Reset"
            >
              <Icon icon={RotateCcw} size={16} />
            </button>
            <button
              onClick={stepBackward}
              disabled={currentIndex === 0}
              className="p-2 text-text-tertiary hover:text-text-primary disabled:opacity-30 rounded-lg transition-colors"
              title="Step Back"
            >
              <Icon icon={SkipBack} size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-primary text-white rounded-full hover:scale-105 transition-all shadow-md shadow-primary/20"
              title={isPlaying ? "Pause" : "Auto Play"}
            >
              <Icon icon={isPlaying ? Pause : Play} size={18} />
            </button>
            <button
              onClick={stepForward}
              disabled={currentIndex === scenario.actions.length - 1}
              className="p-2 text-text-tertiary hover:text-text-primary disabled:opacity-30 rounded-lg transition-colors"
              title="Step Forward"
            >
              <Icon icon={SkipForward} size={16} />
            </button>
          </div>
        </div>

        {/* Current Move Explanation Panel */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header card with current action */}
                <div className="bg-bg-secondary/30 border border-border p-4.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">CURRENT PLAYER</span>
                    <span className="text-sm font-bold text-text-primary">{currentAction.player}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">PLAYED CARD</span>
                    <span className="text-lg font-black text-primary font-mono">{currentAction.action}</span>
                  </div>
                </div>

                {/* Coach feedback */}
                <div className="rounded-xl border border-border bg-bg-card p-4.5 flex gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    currentAction.isBestPlay ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  )}>
                    <Icon icon={currentAction.isBestPlay ? CheckCircle2 : Brain} size={18} />
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-xs font-bold tracking-wider uppercase mb-0.5",
                      currentAction.isBestPlay ? "text-success" : "text-warning"
                    )}>
                      {currentAction.isBestPlay ? "COACH: PERFECT PLAY" : "COACH: SUGGESTED CORRECTION"}
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed mt-1">
                      {currentAction.explanation || "No explanation needed for this card selection."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative lines info */}
              {!currentAction.isBestPlay && (
                <div className="mt-4 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Icon icon={Info} size={12} /> Alternative Line
                  </p>
                  <p className="text-xs text-text-tertiary leading-relaxed">
                    Lead partner&apos;s suit early to signal willingness. Directing card leads provides high-fidelity communication signals.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
