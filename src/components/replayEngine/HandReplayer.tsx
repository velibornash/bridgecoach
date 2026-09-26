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
  
  Sparkles,
  Share2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchAuctions, type AuctionRecord } from "@/services/auctionService";

export interface ReplayAction {
  player: "North" | "East" | "South" | "West";
  action: string; // e.g. "♠A" or "Pass"
  explanation?: string;
  isBestPlay?: boolean;
}

export interface ReplayScenario {
  id: string;
  title: string;
  contract: string;
  declarer: string;
  actions: ReplayAction[];
}

/**
 * Built from a real persisted auction.
 *
 * This was a hardcoded six-card scenario presented as "expert-played hands, one
 * card at a time, with coach annotations on every move" — the plural and the
 * "expert" were both false, and it was the only hand the page had because
 * `/play` never wrote one. Both are now fixed: `/play` records hands, and this
 * component reads the player's own.
 *
 * The "explanation" is the engine's own `engineReason` for a call it rejected,
 * and nothing at all for one it accepted. The previous scenario marked six of
 * six plays `isBestPlay: true`, which is a judgement nothing in the database
 * supports.
 */
const PLAYER_NAMES: Record<string, ReplayAction["player"]> = {
  N: "North",
  E: "East",
  S: "South",
  W: "West",
};

export function scenarioFromAuction(auction: AuctionRecord): ReplayScenario {
  const actions: ReplayAction[] = auction.actions.map((a) => ({
    player: PLAYER_NAMES[a.player] ?? "South",
    action:
      a.type === "bid" && a.level != null
        ? `${a.level}${a.strain === "NT" ? "NT" : (a.strain ?? "")}`
        : a.type === "pass"
          ? "Pass"
          : a.type === "double"
            ? "X"
            : a.type === "redouble"
              ? "XX"
              : a.type,
    // Only present when the engine objected. A correct call gets no comment,
    // because there is nothing to say about it.
    explanation: a.engineReason ?? undefined,
    isBestPlay: a.engineLegal,
  }));

  // The contract comes from the engine's own reconstruction of the recorded
  // calls. `engine` is null when those rows could not be replayed, and a
  // reconstructed contract is the only one worth showing — deriving a contract
  // here would be a second bidding implementation.
  const final = auction.engine?.finalContract ?? null;
  const contractText =
    final && final.level != null
      ? `${final.level}${final.strain === "NT" ? "NT" : (final.strain ?? "")}`
      : null;

  return {
    id: auction.id,
    title: contractText
      ? `${contractText} by ${PLAYER_NAMES[final?.declarer ?? auction.dealer] ?? "South"}`
      : `Auction from ${new Date(auction.startedAt).toLocaleDateString()}`,
    contract: contractText ?? "Auction still open",
    declarer: PLAYER_NAMES[final?.declarer ?? auction.dealer] ?? "South",
    actions,
  };
}

/** Exported for the empty state and for tests. */
export const EMPTY_SCENARIO: ReplayScenario = {
  id: "empty",
  title: "No hands yet",
  contract: "—",
  declarer: "—",
  actions: [],
};

export function HandReplayer({
  /** Injected scenarios. When omitted, the player's own auctions are read. */
  providedScenarios,
}: {
  providedScenarios?: ReplayScenario[];
} = {}) {
  // The fetch is skipped entirely when scenarios are supplied, so an injected
  // component never flashes the loading state or touches the network.
  const { data: auctions, loading, error } = useApiResource(
    async () => (providedScenarios ? { data: [], error: null, status: 200 } : await fetchAuctions()),
    [providedScenarios === undefined],
  );

  // Most recent first, matching the endpoint's ordering, and only auctions that
  // actually recorded a call — an auction with no actions is not replayable and
  // would render as an empty stepper.
  const scenarios =
    providedScenarios ??
    (auctions ?? []).filter((a) => a.actions.length > 0).map(scenarioFromAuction);
  // Only a real fetch can be loading. An injected component is never in flight.
  const isLoading = providedScenarios === undefined && loading;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scenario =
    scenarios.find((s) => s.id === selectedId) ??
    (scenarios.length > 0 ? scenarios[0] : EMPTY_SCENARIO);
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

  // No recorded hands is a real state, and it needs saying. The previous version
  // always had its one hardcoded hand, so this branch could not be reached and
  // the page could not be empty.
  if (isLoading) {
    return (
      <GlassCard variant="premium" hover={false} className="p-6 my-6">
        <p className="text-sm text-text-tertiary">Reading your hands…</p>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard variant="premium" hover={false} className="p-6 my-6">
        <p className="text-sm text-error">{error}</p>
      </GlassCard>
    );
  }

  if (scenarios.length === 0) {
    return (
      <GlassCard variant="premium" hover={false} className="p-6 my-6">
        <h3 className="text-sm font-semibold text-text-primary">No hands to replay yet</h3>
        <p className="mt-1 text-xs text-text-tertiary">
          Replay shows the auctions you have actually played. Nothing is shown here
          until you play a hand — a demonstration hand would not be yours.
        </p>
        <a
          href="/play"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          Play a hand
        </a>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="premium" hover={false} className="p-6 my-6 border-indigo-500/20">
      {scenarios.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {scenarios.slice(0, 12).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedId(s.id);
                setCurrentIndex(0);
                setIsPlaying(false);
              }}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                s.id === scenario.id
                  ? "bg-primary text-white"
                  : "bg-bg-secondary text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {s.title}
            </button>
          ))}
          {scenarios.length > 12 && (
            <span className="self-center text-[10px] text-text-tertiary">
              +{scenarios.length - 12} more
            </span>
          )}
        </div>
      )}

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
