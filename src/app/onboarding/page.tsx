"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type StepId =
  | "welcome"
  | "suits"
  | "suit-quiz"
  | "values"
  | "trick-demo"
  | "trick-pick"
  | "partners"
  | "done";

interface Step {
  id: StepId;
  label: string;
}

const steps: Step[] = [
  { id: "welcome", label: "Welcome" },
  { id: "suits", label: "Suits" },
  { id: "suit-quiz", label: "Quiz" },
  { id: "values", label: "Values" },
  { id: "trick-demo", label: "Tricks" },
  { id: "trick-pick", label: "Play" },
  { id: "partners", label: "Teams" },
  { id: "done", label: "Done" },
];

const suits = [
  { sym: "♠", name: "Spades", color: "text-zinc-300" },
  { sym: "♥", name: "Hearts", color: "text-red-400" },
  { sym: "♦", name: "Diamonds", color: "text-amber-400" },
  { sym: "♣", name: "Clubs", color: "text-emerald-400" },
];

const values = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const initialPool = shuffle(values);

function Bob({ emotion = "wave" }: { emotion?: "wave" | "happy" | "think" | "celebrate" }) {
  const emoji = emotion === "celebrate" ? "🎉" : emotion === "happy" ? "😊" : emotion === "think" ? "🤔" : "🧑‍🌾";
  return (
    <motion.div
      key={emotion}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center"
    >
      <motion.div
        animate={emotion === "wave" ? { rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-6xl sm:text-7xl mb-2"
      >
        {emoji}
      </motion.div>
      <p className="text-xs text-text-tertiary mt-1">Farmer Bob</p>
    </motion.div>
  );
}

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedSuits, setSelectedSuits] = useState<number[]>([]);
  const [suitQuizAnswered, setSuitQuizAnswered] = useState(false);
  const [suitQuizCorrect, setSuitQuizCorrect] = useState(false);
  const [orderedValues, setOrderedValues] = useState<string[]>([]);
  const [valueIndex, setValueIndex] = useState(0);
  const [pool, setPool] = useState<string[]>(initialPool);
  const [valueMistakes, setValueMistakes] = useState(0);
  const [trickPickAnswer, setTrickPickAnswer] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const step = steps[stepIndex];
  const totalSteps = steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const progress = ((stepIndex) / (totalSteps - 1)) * 100;

  const goNext = () => {
    if (stepIndex < totalSteps - 1) {
      setDirection(1);
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }
  };

  // Reset step-specific state
  const [resetStep, setResetStep] = useState(stepIndex);
  if (resetStep !== stepIndex) {
    setResetStep(stepIndex);
    setSelectedSuits([]);
    setSuitQuizAnswered(false);
    setSuitQuizCorrect(false);
    setOrderedValues([]);
    setValueIndex(0);
    setValueMistakes(0);
    setTrickPickAnswer(null);
    setSelectedPartner(null);
    setPool(initialPool);
  }

  const handleSuitClick = (idx: number) => {
    if (!selectedSuits.includes(idx)) {
      setSelectedSuits((prev) => [...prev, idx]);
    }
  };

  const handleSuitQuiz = (answer: string) => {
    setSuitQuizAnswered(true);
    setSuitQuizCorrect(answer === "♠");
  };

  const handleValueClick = (val: string) => {
    if (orderedValues.includes(val)) return;
    const expected = values[valueIndex];
    if (val === expected) {
      setOrderedValues((prev) => [...prev, val]);
      setValueIndex((i) => i + 1);
      setPool((prev) => shuffle(prev.filter((v) => v !== val)));
    } else {
      setValueMistakes((m) => m + 1);
    }
  };

  const allSuitsRevealed = selectedSuits.length === 4;
  const allValuesOrdered = orderedValues.length === 13;

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-primary via-bg-primary to-bg-card flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-bg-primary/80 backdrop-blur-sm">
        <div className="h-1 bg-bg-secondary">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-indigo-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2 max-w-lg mx-auto">
          <div className="flex items-center gap-1.5">
            {steps.slice(0, -1).map((s, i) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? "bg-primary w-5" : "bg-bg-secondary w-2"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-text-tertiary font-mono">{stepIndex + 1}/{totalSteps}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pt-14 pb-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* ===== WELCOME ===== */}
              {step.id === "welcome" && (
                <div className="text-center">
                  <Bob emotion="wave" />
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-2xl sm:text-3xl font-bold text-text-primary"
                  >
                    Welcome to Bridge!
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-2 text-sm text-text-secondary"
                  >
                    I&apos;m Farmer Bob! I&apos;ll teach you the world&apos;s greatest card game.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-1 text-xs text-text-tertiary"
                  >
                    Don&apos;t worry — I&apos;ll start from the very beginning.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-8"
                  >
                    <button
                      onClick={goNext}
                      className="rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                    >
                      Let&apos;s Go! →
                    </button>
                  </motion.div>
                </div>
              )}

              {/* ===== SUITS ===== */}
              {step.id === "suits" && (
                <div className="text-center">
                  <Bob emotion="happy" />
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xl font-bold text-text-primary"
                  >
                    Meet the Suits
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-sm text-text-secondary"
                  >
                    Tap each card to reveal a suit!
                  </motion.p>

                  <div className="mt-6 grid grid-cols-4 gap-3">
                    {suits.map((suit, i) => {
                      const revealed = selectedSuits.includes(i);
                      return (
                        <motion.button
                          key={suit.sym}
                          onClick={() => handleSuitClick(i)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={!revealed ? { scale: 1.05 } : {}}
                          whileTap={!revealed ? { scale: 0.95 } : {}}
                          className={`aspect-[3/4] rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                            revealed
                              ? "border-primary/50 bg-primary/10"
                              : "border-border bg-bg-secondary hover:border-border-hover"
                          }`}
                        >
                          {revealed ? (
                            <motion.div
                              initial={{ scale: 0, rotateZ: -180 }}
                              animate={{ scale: 1, rotateZ: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              className="flex flex-col items-center"
                            >
                              <span className={`text-4xl ${suit.color}`}>{suit.sym}</span>
                              <span className="text-[10px] text-text-tertiary mt-1">{suit.name}</span>
                            </motion.div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-4xl text-text-tertiary/30">?</span>
                              <span className="text-[10px] text-text-tertiary/30 mt-1">Tap</span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {allSuitsRevealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <p className="text-sm text-success font-medium mb-3">🎉 Great! Those are the 4 suits!</p>
                      <button
                        onClick={goNext}
                        className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                      >
                        Next →
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ===== SUIT QUIZ ===== */}
              {step.id === "suit-quiz" && (
                <div className="text-center">
                  <Bob emotion="think" />
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xl font-bold text-text-primary"
                  >
                    Quick Quiz!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-sm text-text-secondary"
                  >
                    Which suit has a <span className="text-zinc-300 font-bold">spade</span> shape?
                  </motion.p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {suits.map((suit, i) => (
                      <button
                        key={suit.sym}
                        onClick={() => handleSuitQuiz(suit.sym)}
                        disabled={suitQuizAnswered}
                        className={`rounded-2xl border-2 py-5 text-center transition-all duration-200 ${
                          suitQuizAnswered
                            ? suit.sym === "♠"
                              ? "border-success bg-success-light"
                              : "border-border opacity-40"
                            : "border-border hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <span className={`text-4xl block ${suit.color}`}>{suit.sym}</span>
                        <span className="text-xs text-text-tertiary mt-1 block">{suit.name}</span>
                      </button>
                    ))}
                  </div>

                  {suitQuizAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <p className={`text-sm font-medium mb-3 ${suitQuizCorrect ? "text-success" : "text-danger"}`}>
                        {suitQuizCorrect ? "🎉 Correct! Great memory!" : "Not quite! Spades look like this: ♠"}
                      </p>
                      <button
                        onClick={goNext}
                        className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                      >
                        {suitQuizCorrect ? "Next →" : "Try Again"}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ===== VALUES ===== */}
              {step.id === "values" && (
                <div className="text-center">
                  <Bob emotion="happy" />
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xl font-bold text-text-primary"
                  >
                    Card Values
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-sm text-text-secondary"
                  >
                    Tap cards from <strong>highest</strong> to <strong>lowest</strong> value.
                  </motion.p>

                  {/* Ordered track */}
                  <div className="mt-4 flex flex-wrap gap-1.5 justify-center min-h-[40px]">
                    {orderedValues.map((v) => (
                      <motion.span
                        key={v}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-xs font-bold text-success"
                      >
                        {v}
                      </motion.span>
                    ))}
                  </div>

                  {/* Card grid */}
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {pool.map((val, i) => (
                        <motion.button
                          key={val}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => handleValueClick(val)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-card text-sm font-bold text-text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          {val}
                        </motion.button>
                      ))}
                  </div>

                  {valueMistakes > 0 && (
                    <p className="mt-2 text-xs text-text-tertiary">
                      {valueMistakes} {valueMistakes === 1 ? "slip" : "slips"} — keep going!
                    </p>
                  )}

                  {allValuesOrdered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <p className="text-sm text-success font-medium mb-3">
                        🎉 Perfect! Ace is highest, 2 is lowest.
                      </p>
                      <button
                        onClick={goNext}
                        className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                      >
                        Next →
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ===== TRICK DEMO ===== */}
              {step.id === "trick-demo" && (
                <div className="text-center">
                  <Bob emotion="think" />
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xl font-bold text-text-primary"
                  >
                    What&apos;s a Trick?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-sm text-text-secondary"
                  >
                    A trick is <strong>4 cards</strong> — one from each player.
                  </motion.p>

                  <div className="mt-8 relative h-48 flex items-center justify-center">
                    {/* Cards flying in */}
                    {["♠A", "♠K", "♠Q", "♠J"].map((card, i) => {
                      const positions = [
                        { x: -80, y: -40, delay: 0.1 },
                        { x: 80, y: -40, delay: 0.25 },
                        { x: -80, y: 40, delay: 0.4 },
                        { x: 80, y: 40, delay: 0.55 },
                      ];
                      return (
                        <motion.div
                          key={card}
                          initial={{ opacity: 0, x: positions[i].x * 3, y: positions[i].y * 3, rotateZ: 30 }}
                          animate={{ opacity: 1, x: positions[i].x, y: positions[i].y, rotateZ: 0 }}
                          transition={{ delay: positions[i].delay + 0.5, duration: 0.5, type: "spring" }}
                          className="absolute flex h-14 w-10 items-center justify-center rounded-xl border border-border bg-bg-card shadow-lg"
                        >
                          <span className="text-lg font-bold text-zinc-300">{card}</span>
                        </motion.div>
                      );
                    })}

                    {/* Highlight the winner */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.8 }}
                      className="absolute -top-4 -right-4"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: 2 }}
                        className="text-2xl"
                      >
                        👑
                      </motion.span>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    className="mt-4"
                  >
                    <p className="text-sm text-primary font-medium">
                      ♠A wins! Highest card of the lead suit takes the trick.
                    </p>
                    <button
                      onClick={goNext}
                      className="mt-4 rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                    >
                      I Get It! →
                    </button>
                  </motion.div>
                </div>
              )}

              {/* ===== TRICK PICK ===== */}
              {step.id === "trick-pick" && (
                <div className="text-center">
                  <Bob emotion="think" />
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xl font-bold text-text-primary"
                  >
                    Your First Trick!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-sm text-text-secondary"
                  >
                    ♠K is led. Which card wins?
                  </motion.p>

                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    {[
                      { card: "♠K", by: "West", isWinner: false },
                      { card: "♠A", by: "North", isWinner: true },
                      { card: "♠5", by: "East", isWinner: false },
                      { card: "♠Q", by: "South", isWinner: false },
                    ].map((c) => {
                      const isSelected = trickPickAnswer === c.card;
                      const showResult = trickPickAnswer !== null;
                      const isCorrect = showResult && c.isWinner;
                      const isWrong = showResult && isSelected && !c.isWinner;

                      return (
                        <button
                          key={c.card}
                          onClick={() => !showResult && setTrickPickAnswer(c.card)}
                          className={`rounded-2xl border-2 py-4 text-center transition-all duration-200 ${
                            isCorrect
                              ? "border-success bg-success-light"
                              : isWrong
                                ? "border-danger bg-danger-light"
                                : isSelected
                                  ? "border-primary bg-primary/10"
                                  : showResult && c.isWinner
                                    ? "border-success/50 bg-success-light/30"
                                    : "border-border bg-bg-secondary hover:border-primary/50"
                          }`}
                        >
                          <span className="text-2xl font-bold text-zinc-300">{c.card}</span>
                          <p className="text-[10px] text-text-tertiary mt-0.5">{c.by}</p>
                        </button>
                      );
                    })}
                  </div>

                  {trickPickAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <p className={`text-sm font-medium mb-3 ${trickPickAnswer === "♠A" ? "text-success" : "text-danger"}`}>
                        {trickPickAnswer === "♠A"
                          ? "🎉 Correct! The Ace beats everything!"
                          : "Not quite! The Ace (♠A) is higher than the King (♠K)."}
                      </p>
                      <button
                        onClick={goNext}
                        className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                      >
                        {trickPickAnswer === "♠A" ? "Next →" : "Try Again"}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ===== PARTNERS ===== */}
              {step.id === "partners" && (
                <div className="text-center">
                  <Bob emotion="happy" />
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xl font-bold text-text-primary"
                  >
                    Teams & Partners
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-sm text-text-secondary"
                  >
                    Bridge is played with <strong>4 players</strong> — 2 teams of 2.
                  </motion.p>

                  <div className="mt-8 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                    {/* N */}
                    <div className="col-start-2">
                      <div className={`rounded-xl border-2 p-3 text-center transition-all ${
                        selectedPartner === "NS" ? "border-primary bg-primary/10" : "border-border bg-bg-secondary"
                      }`}>
                        <span className="text-xs text-text-tertiary">North</span>
                        <p className="text-lg font-bold text-text-primary">N</p>
                      </div>
                    </div>
                    {/* W */}
                    <div className="col-start-1 row-start-2">
                      <div className={`rounded-xl border-2 p-3 text-center transition-all ${
                        selectedPartner === "WE" ? "border-amber-500/50 bg-amber-500/10" : "border-border bg-bg-secondary"
                      }`}>
                        <span className="text-xs text-text-tertiary">West</span>
                        <p className="text-lg font-bold text-text-primary">W</p>
                      </div>
                    </div>
                    {/* Center */}
                    <div className="col-start-2 row-start-2 flex items-center justify-center">
                      <span className="text-2xl">🃏</span>
                    </div>
                    {/* E */}
                    <div className="col-start-3 row-start-2">
                      <div className={`rounded-xl border-2 p-3 text-center transition-all ${
                        selectedPartner === "WE" ? "border-amber-500/50 bg-amber-500/10" : "border-border bg-bg-secondary"
                      }`}>
                        <span className="text-xs text-text-tertiary">East</span>
                        <p className="text-lg font-bold text-text-primary">E</p>
                      </div>
                    </div>
                    {/* S */}
                    <div className="col-start-2 row-start-3">
                      <div className={`rounded-xl border-2 p-3 text-center transition-all ${
                        selectedPartner === "NS" ? "border-primary bg-primary/10" : "border-border bg-bg-secondary"
                      }`}>
                        <span className="text-xs text-text-tertiary">South</span>
                        <p className="text-lg font-bold text-text-primary">S</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 justify-center">
                    <button
                      onClick={() => setSelectedPartner("NS")}
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                        selectedPartner === "NS" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"
                      }`}
                    >
                      N + S = Team 1
                    </button>
                    <button
                      onClick={() => setSelectedPartner("WE")}
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                        selectedPartner === "WE" ? "bg-amber-500 text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"
                      }`}
                    >
                      W + E = Team 2
                    </button>
                  </div>

                  {selectedPartner && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5"
                    >
                      <p className="text-sm text-text-secondary mb-3">
                        {selectedPartner === "NS"
                          ? "North & South are partners! East & West are the other team."
                          : "West & East are partners! North & South are the other team."}
                      </p>
                      <button
                        onClick={goNext}
                        className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                      >
                        Got It! →
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ===== DONE ===== */}
              {step.id === "done" && (
                <div className="text-center">
                  <Bob emotion="celebrate" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                    className="mt-4 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-success to-emerald-600"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-5 text-2xl font-bold text-text-primary"
                  >
                    Amazing! 🎉
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 text-sm text-text-secondary"
                  >
                    You just learned the basics of bridge:
                  </motion.p>
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 space-y-2 text-sm"
                  >
                    {[
                      "4 suits: ♠ ♥ ♦ ♣",
                      "Card values: A (highest) → 2 (lowest)",
                      "A trick = 4 cards, highest wins",
                      "Partners sit across from each other",
                    ].map((item, i) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="flex items-center gap-2 justify-center text-text-secondary"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0">
                          <path d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {item}
                      </motion.li>
                    ))}
                  </motion.ul>

                  {/* XP earned */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-warning/10 px-5 py-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <span className="text-sm font-bold text-warning">+50 XP</span>
                    <span className="text-xs text-text-tertiary">Welcome Bonus</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <Link
                      href="/learning-path"
                      className="rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white transition-all hover:bg-primary-hover active:scale-95"
                    >
                      Start Lesson 1 →
                    </Link>
                    <Link
                      href="/dashboard"
                      className="rounded-xl border border-border bg-bg-secondary px-8 py-3 text-base font-semibold text-text-primary transition-all hover:bg-bg-secondary/80 active:scale-95"
                    >
                      Go to Dashboard
                    </Link>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Back button */}
          {!isFirst && step.id !== "done" && (
            <button
              onClick={goBack}
              className="mt-6 mx-auto block text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
