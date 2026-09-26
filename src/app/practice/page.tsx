"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BiddingBox, type Bid } from "@/components/biddingBox/BiddingBox";
import { HandViewer } from "@/components/handViewer/HandViewer";
import { BridgeTable, type BridgeTableHand } from "@/components/bridge/BridgeTable";
import { CardEngine, createDeck, shuffleDeck, type BridgeCard, type Suit } from "@/components/cardEngine/CardEngine";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { recordPracticeSession, type PracticeActionInput } from "@/services/practiceService";

export default function PracticePage() {
  const [phase, setPhase] = useState<'menu' | 'dealing' | 'playing' | 'result'>('menu');
  const [hands, setHands] = useState<Record<'north' | 'east' | 'south' | 'west', BridgeCard[]>>({
    north: [], east: [], south: [], west: [],
  });
  const [trumpSuit] = useState<Suit>('♠');
  const [currentBid, setCurrentBid] = useState<string | null>(null);
  const [contract, setContract] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<BridgeCard | null>(null);
  const [trickNumber, setTrickNumber] = useState(1);
  const [tricksWon, setTricksWon] = useState(0);
  const [tricksTotal, setTricksTotal] = useState(0);
  const [showHand, setShowHand] = useState(true);

  /**
   * Actions are accumulated in a ref rather than state because they are appended
   * on every bid and every card played, and re-rendering the whole table on each
   * one to keep an array in sync is not worth it. The ref is also what
   * `beforeunload` can read synchronously, which state cannot.
   */
  const actions = useRef<PracticeActionInput[]>([]);
  const startedAt = useRef<number | null>(null);
  const saved = useRef(false);
  /**
   * The count is mirrored into state because the button's label needs it during
   * render, and reading a ref while rendering is not allowed — the value would
   * be whatever the last commit happened to leave behind. The ref remains the
   * source of truth for the payload; this is only a display counter.
   */
  const [actionCount, setActionCount] = useState(0);
  const track = (action: PracticeActionInput) => {
    actions.current.push(action);
    setActionCount(actions.current.length);
  };

  useEffect(() => {
    /**
     * Save on the way out.
     *
     * `sendBeacon` rather than `fetch`: a normal request started during unload is
     * cancelled, and the whole point is to capture the session the user is
     * leaving. A drill abandoned halfway is still evidence of what was
     * attempted, which is what a skill model is built from — so this fires
     * regardless of how the drill ended.
     */
    const flush = () => {
      if (saved.current || startedAt.current === null || actions.current.length === 0) return;
      saved.current = true;
      const payload = JSON.stringify({
        actions: actions.current,
        isComplete: false,
        durationMs: Date.now() - startedAt.current,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/practice",
          new Blob([payload], { type: "application/json" }),
        );
      }
    };

    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  const finishPractice = useCallback(async () => {
    if (actions.current.length === 0) {
      showToast("info", "Nothing was played, so there is nothing to save.");
      return;
    }
    const result = await recordPracticeSession({
      actions: actions.current,
      isComplete: false,
      durationMs: startedAt.current ? Date.now() - startedAt.current : undefined,
    });
    if (result.error) {
      showToast("error", `Could not save this session: ${result.error}`);
      return;
    }
    saved.current = true;
    showToast("success", `Session saved — ${actions.current.length} actions recorded.`);
  }, []);

  const startPractice = () => {
    const deck = shuffleDeck(createDeck());
    actions.current = [];
    setActionCount(0);
    saved.current = false;
    startedAt.current = Date.now();
    setHands({
      north: deck.filter((_, i) => i % 4 === 0).map((c) => ({ ...c, faceUp: true })),
      east: deck.filter((_, i) => i % 4 === 1).map((c) => ({ ...c, faceUp: true })),
      south: deck.filter((_, i) => i % 4 === 2).map((c) => ({ ...c, faceUp: true })),
      west: deck.filter((_, i) => i % 4 === 3).map((c) => ({ ...c, faceUp: true })),
    });
    setPhase('playing');
    setTrickNumber(1);
    setTricksWon(0);
    setTricksTotal(0);
    setContract(null);
    setCurrentBid(null);
    setSelectedCard(null);
    showToast('info', 'Practice mode started — explore freely!');
  };

  const handleBid = useCallback((bid: { label: string; suit: string; level: number } | null) => {
    if (bid) {
      setContract(`${bid.label}`);
      setCurrentBid(bid.label);
      setTricksTotal(bid.level || 7);
      // Recorded as an attempt, not a grade. This page is free play, so there is
      // no correctness to assert here - the engine feedback on the tactical page
      // is where judgement lives.
      track({ phase: "bidding", player: "south", call: bid.label });
      showToast('success', `Contract: ${bid.label}`);
    }
  }, []);

  const handlePlayCard = useCallback((card: BridgeCard) => {
    setSelectedCard(card);
    track({ phase: "play", player: "south", card: `${card.suit}${card.rank}` });
    setShowHand(false);
    setTimeout(() => {
      setSelectedCard(null);
      setShowHand(true);
    }, 1200);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-6 sm:py-8">
        <Container className="max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Practice Mode</h1>
                <p className="text-sm text-text-tertiary mt-1">
                  No scoring, just explore bridge at your pace. Bids and cards are
                  recorded so your practice history builds up.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {actionCount > 0 && (
                  <Button variant="secondary" size="sm" onClick={finishPractice}>
                    Save session ({actionCount})
                  </Button>
                )}
                <Badge variant="success">Free Play</Badge>
              </div>
            </div>

            {phase === 'menu' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                    <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-3">Welcome to Practice</h2>
                <p className="text-sm text-text-tertiary max-w-md mx-auto mb-8">
                  Play bridge without any pressure. No scoring, no timer — just explore the cards and learn at your own pace.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={startPractice} size="lg">
                    Start Practice
                  </Button>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
                  {[
                    { icon: "🃏", label: "13 Cards", desc: "Full hand" },
                    { icon: "♠", label: "Trump", desc: "Spades" },
                    { icon: "∞", label: "Free", desc: "No scoring" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-bg-card p-3">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <p className="text-xs font-medium text-text-primary">{item.label}</p>
                      <p className="text-[9px] text-text-tertiary">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'playing' && (
              <div className="space-y-6">
                {/* Status bar */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-bg-card px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-text-secondary">Trick {trickNumber}</span>
                    {contract && (
                      <Badge variant="primary" className="text-[10px]">Contract: {contract}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary">Trump: {trumpSuit}</span>
                    <Badge variant="success" className="text-[10px]">♣ Practice</Badge>
                  </div>
                </div>

                {/* Table */}
                <BridgeTable
                  hands={(
                    ["north", "east", "south", "west"] as const
                  ).map((pos): BridgeTableHand => ({
                    position: pos,
                    cards: hands[pos].map((c) => `${c.suit}${c.rank}`),
                  }))}
                  contract={contract ?? undefined}
                  size="md"
                />

                {/* Hand viewer */}
                {showHand && hands.south.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-bg-card p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-text-primary">Your Hand</h3>
                      <div className="flex gap-2">
                        <HandViewer
                          hand={hands.south}
                          size="sm"
                          interactive
                          onCardClick={handlePlayCard}
                          selectable
                          selected={selectedCard ? [selectedCard.id] : []}
                          maxVisible={13}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Bidding box - simplified for practice */}
                <BiddingBox
                  yourHand="south"
                  currentBid={currentBid ? { level: 0, suit: 'PASS' as Bid['suit'], label: currentBid, description: currentBid } : null}
                  onBid={handleBid}
                  disabled={!!contract}
                />
              </div>
            )}
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
