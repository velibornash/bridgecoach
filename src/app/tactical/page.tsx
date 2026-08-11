"use client";

import { useState } from "react";import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/icons/Icon";
import { CheckCircle2, XCircle, RotateCcw, Target, Trophy, Brain, Sparkles } from "lucide-react";
import { TacticalEngine, TacticalScenario, Position, BridgeHand } from "@/components/tacticalEngine/TacticalEngine";
import { BridgeTable, type BridgeTableHand } from "@/components/bridge/BridgeTable";
import { BidCard } from "@/components/bridge/BidCard";
import { getBidHint, validateTacticalBid } from "@/services/aiCoachService";
import { showToast } from "@/components/ui/Toast";

const north: BridgeHand = { spades: ["SK", "SJ", "S8", "S3"], hearts: ["HA", "HJ", "H5"], diamonds: ["DA", "D8", "D3"], clubs: ["CQ", "C5", "C4"] };
const south: BridgeHand = { spades: ["SA", "SQ", "S5", "S2"], hearts: ["HK", "HQ", "H3"], diamonds: ["DK", "D6", "D2"], clubs: ["CJ", "C8", "C3"] };
const east: BridgeHand = { spades: ["S9", "S7", "S6"], hearts: ["H10", "H8", "H4", "H2"], diamonds: ["DQ", "DJ", "D9", "D7"], clubs: ["C10", "C6"] };
const west: BridgeHand = { spades: ["S10", "S4"], hearts: ["H9", "H7", "H6"], diamonds: ["D10", "D5", "D4"], clubs: ["CA", "CK", "C9", "C7", "C2"] };

const scenario: TacticalScenario = {
  id: "ts1",
  title: "1NT Opening & Stayman",
  difficulty: "Beginner",
  dealer: "S",
  vulnerability: "None",
  hands: { N: north, E: east, S: south, W: west },
  expectedAuction: ["1NT", "P", "2C", "P", "2S", "P", "4S", "P", "P", "P"],
  explanation: "North uses Stayman (2C) to look for a 4-card major fit. Opener rebids 2S, showing four spades. With a confirmed 4-4 spade fit and 15 HCP, North raises to game in 4S.",
};

const quickBids = ["P", "1NT", "2C", "2D", "2H", "2S", "2NT", "3NT", "4S", "X"];

const positionMap: Record<Position, BridgeTableHand["position"]> = {
  N: "north",
  E: "east",
  S: "south",
  W: "west",
};

const positionOrder: Position[] = ["N", "E", "S", "W"];

function getCurrentBidder(dealer: Position, bidsMade: number): Position {
  const dealerIndex = positionOrder.indexOf(dealer);
  return positionOrder[(dealerIndex + bidsMade) % 4];
}

function toBridgeTableHands(hands: Record<Position, BridgeHand>): BridgeTableHand[] {
  return (["N", "E", "S", "W"] as const).map((pos) => ({
    position: positionMap[pos],
    cards: [...hands[pos].spades, ...hands[pos].hearts, ...hands[pos].diamonds, ...hands[pos].clubs],
  }));
}

function toFlatCards(hand: BridgeHand): string[] {
  return [...hand.spades, ...hand.hearts, ...hand.diamonds, ...hand.clubs];
}

export default function TacticalPage() {
  const [engine] = useState(() => new TacticalEngine(scenario));

  const [bids, setBids] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; expected: string; explanation?: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const currentBidder = getCurrentBidder(scenario.dealer, bids.length);
  const currentBidderTablePos = positionMap[currentBidder];

  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const askHint = async () => {
    if (hintLoading) return;
    setHintLoading(true);
    try {
      const text = await getBidHint({
        hands: Object.fromEntries(
          (["N", "E", "S", "W"] as const).map((pos) => [pos, toFlatCards(scenario.hands[pos])])
        ),
        dealer: scenario.dealer,
        vulnerability: scenario.vulnerability,
        auction: bids,
        turn: currentBidder,
        expectedNextBid: scenario.expectedAuction[bids.length],
      });
      setHint(text);
    } finally {
      setHintLoading(false);
    }
  };

  const submitBid = async (raw: string) => {
    if (finished || validating) return;
    const bid = raw.trim().toUpperCase();
    if (!bid) return;

    const lineResult = engine.submitBid(bid);

    if (lineResult.isCorrect) {
      acceptBid(bid, scenario.explanation);
      setInput("");
      return;
    }

    // The bid diverges from the expert line — ask the real AI coach to judge
    // this exact deal and auction. If AI is unavailable, keep the strict line check.
    setValidating(true);
    try {
      const verdict = await validateTacticalBid({
        hands: Object.fromEntries(
          (["N", "E", "S", "W"] as const).map((pos) => [pos, toFlatCards(scenario.hands[pos])])
        ),
        dealer: scenario.dealer,
        vulnerability: scenario.vulnerability,
        auction: engine.getCurrentState().currentBids,
        turn: currentBidder,
        proposedBid: bid,
      });

      if (verdict && verdict.legal === false) {
        setFeedback({ correct: false, expected: "", explanation: verdict.explanation || "Illegal call." });
        showToast("error", verdict.explanation || "Illegal call.");
        setInput("");
        return;
      }

      if (verdict && verdict.correct) {
        engine.pushBid(bid);
        setBids(engine.getCurrentState().currentBids);
        setScore((s) => s + 1);
        setFeedback({ correct: true, expected: bid, explanation: verdict.explanation || "A good bid — the AI coach approved it." });
        showToast("success", "Good bid — approved by the AI coach.");
        if (engine.isAuctionComplete()) {
          setFinished(true);
          showToast("success", "Auction complete!");
        }
        setInput("");
        return;
      }

      const expected = verdict?.suggestedBid || lineResult.expected;
      setFeedback({
        correct: false,
        expected,
        explanation: verdict?.explanation || lineResult.explanation,
      });
      showToast("error", `Not a good bid — try ${expected}`);
    } catch {
      setFeedback({ correct: false, expected: lineResult.expected, explanation: lineResult.explanation });
      showToast("error", `Expected: ${lineResult.expected}`);
    } finally {
      setValidating(false);
    }
    setInput("");
  };

  const acceptBid = (bid: string, explanation: string) => {
    setBids(engine.getCurrentState().currentBids);
    setScore((s) => s + 1);
    setFeedback({ correct: true, expected: bid, explanation });
    if (engine.isAuctionComplete()) {
      setFinished(true);
      showToast("success", "Auction complete — perfect bidding line!");
    }
  };

  const reset = () => {
    engine.reset();
    setBids([]);
    setFeedback(null);
    setFinished(false);
    setScore(0);
    setInput("");
    setHint(null);
    setValidating(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Tactical Drills</span>
          </div>
          <h1 className="text-heading text-text-primary mb-2">Bidding Tactical Engine</h1>
          <p className="text-sm text-text-tertiary mb-6">
            Reproduce the correct auction move by move. Bids are checked against the expert line and reviewed by the AI coach.
          </p>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <GlassCard variant="premium" hover={false} className="p-5 border-indigo-500/20">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/80">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{scenario.title}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {scenario.difficulty} · Dealer: {scenario.dealer} · Vul: {scenario.vulnerability}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Score</span>
                    <span className="text-lg font-black text-primary font-mono">{score} / {scenario.expectedAuction.length}</span>
                  </div>
                </div>

                <BridgeTable
                  hands={toBridgeTableHands(scenario.hands)}
                  dealer={scenario.dealer}
                  vulnerability={scenario.vulnerability}
                  size="lg"
                  turn={finished ? undefined : currentBidderTablePos}
                  className="mb-6"
                />

                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon icon={Target} size={14} className="text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Auction so far</span>
                    <span className="ml-auto text-xs font-medium text-primary">
                      {currentBidderTablePos.toUpperCase()} to bid
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-9">
                    {bids.length === 0 && (
                      <span className="text-xs text-text-tertiary self-center">No bids yet — enter your first bid.</span>
                    )}
                    {bids.map((b, i) => {
                      const bidderPos = positionOrder[(positionOrder.indexOf(scenario.dealer) + i) % 4];
                      const bidderTablePos = positionMap[bidderPos];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">{bidderTablePos[0].toUpperCase()}</span>
                          <BidCard bid={b} size="md" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {finished ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-success/30 bg-success/10 p-4 flex items-center gap-3"
                  >
                    <Icon icon={Trophy} size={22} className="text-success" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-success">Auction complete!</p>
                      <p className="text-xs text-text-secondary mt-0.5">You reproduced the full expert bidding line correctly.</p>
                    </div>
                    <button onClick={reset} className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
                      <Icon icon={RotateCcw} size={13} /> Try again
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {quickBids.map((b) => (
                        <button
                          key={b}
                          onClick={() => submitBid(b)}
                          disabled={validating}
                          className="transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <BidCard
                            bid={b}
                            size="md"
                            className="cursor-pointer hover:border-primary hover:shadow-primary/25"
                          />
                        </button>
                      ))}
                    </div>
                    {validating && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        AI coach is reviewing this bid…
                      </div>
                    )}
                    <form
                      onSubmit={(e) => { e.preventDefault(); submitBid(input); }}
                      className="flex gap-2"
                    >
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a bid, e.g. 2C or P..."
                        disabled={validating}
                        className="flex-1 bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs font-mono text-text-primary outline-none focus:border-primary transition-colors disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={validating || !input.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {validating ? "…" : "Bid"}
                      </button>
                    </form>
                  </>
                )}
              </GlassCard>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.div
                    key={`${feedback.expected}-${feedback.correct}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`rounded-xl border p-4 ${feedback.correct ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon icon={feedback.correct ? CheckCircle2 : XCircle} size={16} className={feedback.correct ? "text-success" : "text-danger"} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${feedback.correct ? "text-success" : "text-danger"}`}>
                        {feedback.correct ? "Correct bid" : "Not the expected bid"}
                      </span>
                    </div>
                    {!feedback.correct && (
                      <p className="text-xs text-text-secondary mt-1">
                        Expected: <span className="font-mono font-bold text-text-primary">{feedback.expected}</span>
                      </p>
                    )}
                    <p className="text-xs text-text-tertiary leading-relaxed mt-1.5">
                      {feedback.explanation ?? scenario.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <GlassCard variant="secondary" hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon={Brain} size={14} className="text-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Coach Tip</span>
                </div>
                <p className="text-xs text-text-tertiary leading-relaxed mb-3">
                  {scenario.explanation} Use the quick-bid buttons for speed, or type any legal bid. Pass (P) is always legal.
                </p>

                <button
                  onClick={askHint}
                  disabled={hintLoading || finished}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                >
                  <Icon icon={Sparkles} size={14} />
                  {hintLoading ? "Analyzing..." : "Ask AI for a hint"}
                </button>

                {hint && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">AI Coach</p>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{hint}</p>
                  </motion.div>
                )}
              </GlassCard>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
