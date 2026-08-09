"use client";

import { useState } from "react";import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/icons/Icon";
import { CheckCircle2, XCircle, RotateCcw, Target, Trophy, Brain } from "lucide-react";
import { TacticalEngine, TacticalScenario, Position, BridgeHand } from "@/components/tacticalEngine/TacticalEngine";
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
  expectedAuction: ["1NT", "P", "2C", "P", "2H", "P", "3NT", "P", "P", "P"],
  explanation: "North uses Stayman (2C) to look for a 4-card major, then settles in 3NT with 10+ HCP and no major fit.",
};

const quickBids = ["P", "1NT", "2C", "2D", "2H", "2S", "2NT", "3NT", "X"];

const positionOrder: Position[] = ["N", "E", "S", "W"];

function cardList(hand: BridgeHand): string[] {
  const suits: { key: keyof BridgeHand; sym: string }[] = [
    { key: "spades", sym: "♠" },
    { key: "hearts", sym: "♥" },
    { key: "diamonds", sym: "♦" },
    { key: "clubs", sym: "♣" },
  ];
  const out: string[] = [];
  suits.forEach(({ key, sym }) => hand[key].forEach((card) => out.push(`${sym}${card.slice(1)}`)));
  return out;
}

export default function TacticalPage() {
  const [engine] = useState(() => new TacticalEngine(scenario));

  const [bids, setBids] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; expected: string; explanation?: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const submitBid = (raw: string) => {
    if (finished) return;
    const bid = raw.trim().toUpperCase();
    if (!bid) return;

    const result = engine.submitBid(bid);
    setFeedback({ correct: result.isCorrect, expected: result.expected, explanation: result.explanation });

    if (result.isCorrect) {
      setBids(engine.getCurrentState().currentBids);
      setScore((s) => s + 1);
      if (result.isComplete) {
        setFinished(true);
        showToast("success", "Auction complete — perfect bidding line!");
      }
    } else {
      showToast("error", `Expected: ${result.expected}`);
    }
    setInput("");
  };

  const reset = () => {
    engine.reset();
    setBids([]);
    setFeedback(null);
    setFinished(false);
    setScore(0);
    setInput("");
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
            Reproduce the correct auction move by move. The engine validates each bid against the expert line.
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

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {positionOrder.map((pos) => (
                    <div key={pos} className={`rounded-xl border border-border p-2.5 ${pos === "S" ? "bg-primary/10 border-primary/30" : "bg-bg-secondary/40"}`}>
                      <span className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{pos} ({pos === "S" ? "You" : "Opponent"})</span>
                      <p className="text-xs font-mono text-text-primary leading-relaxed">
                        {cardList(scenario.hands[pos]).join(" ")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon icon={Target} size={14} className="text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Auction so far</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-9">
                    {bids.length === 0 && (
                      <span className="text-xs text-text-tertiary self-center">No bids yet — enter your first bid.</span>
                    )}
                    {bids.map((b, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                          b === "P" ? "bg-bg-secondary border-border text-text-tertiary" : "bg-primary/15 border-primary/40 text-primary"
                        }`}
                      >
                        {b}
                      </motion.span>
                    ))}
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
                          className="px-3 py-1.5 rounded-lg border border-border bg-bg-secondary text-xs font-bold font-mono text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <form
                      onSubmit={(e) => { e.preventDefault(); submitBid(input); }}
                      className="flex gap-2"
                    >
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a bid, e.g. 2C or P..."
                        className="flex-1 bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs font-mono text-text-primary outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                      >
                        Bid
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
                <p className="text-xs text-text-tertiary leading-relaxed">
                  {scenario.explanation} Use the quick-bid buttons for speed, or type any legal bid. Pass (P) is always legal.
                </p>
              </GlassCard>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
