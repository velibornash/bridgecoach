"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import { 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  AlertCircle, 
  Play, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy
} from "lucide-react";
import { LearningBlock } from "./types";
import { GlassCard } from "@/components/ui/GlassCard";
import { CardTable } from "@/components/lesson/CardTable";

interface BlockRendererProps {
  block: LearningBlock;
  onComplete?: (id: string) => void;
  isCompleted?: boolean;
}

export function BlockRenderer({ block, onComplete, isCompleted = false }: BlockRendererProps) {
  // State for Reveal Answer block
  const [revealed, setResolved] = useState(false);

  // State for Quiz block
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // State for Flashcard block
  const [cardFlipped, setCardFlipped] = useState(false);

  const markCompleted = () => {
    if (onComplete) onComplete(block.id);
  };

  switch (block.type) {
    case "heading":
      return (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative pl-4 border-l-4 border-primary/80 py-1 my-6"
          onClick={markCompleted}
        >
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {block.text}
          </h2>
        </motion.div>
      );

    case "paragraph":
      return (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-base text-text-secondary leading-relaxed mb-4 cursor-pointer hover:text-text-primary transition-colors"
          onClick={markCompleted}
        >
          {block.text}
        </motion.p>
      );

    case "callout":
    case "hint":
      const isHint = block.type === "hint";
      return (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            "rounded-xl border p-4 my-4 flex gap-3 cursor-pointer transition-all duration-300",
            isCompleted 
              ? "border-success/30 bg-success/5" 
              : isHint
                ? "border-amber-500/20 bg-amber-500/5 shadow-sm shadow-amber-500/5"
                : "border-primary/20 bg-primary/5 shadow-sm shadow-primary/5"
          )}
          onClick={markCompleted}
        >
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isHint ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"
          )}>
            <Icon icon={isHint ? Lightbulb : AlertCircle} size={18} />
          </div>
          <div>
            <h4 className={cn(
              "text-xs font-bold tracking-wider uppercase mb-0.5",
              isHint ? "text-amber-400" : "text-primary"
            )}>
              {block.title || (isHint ? "PRO TIP" : "IMPORTANT NOTE")}
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">{block.text}</p>
          </div>
        </motion.div>
      );

    case "example":
      return (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            "rounded-xl border p-5 my-5 flex gap-4 cursor-pointer border-indigo-500/20 bg-indigo-500/5 shadow-sm shadow-indigo-500/5",
            isCompleted && "border-success/30 bg-success/5"
          )}
          onClick={markCompleted}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Icon icon={Sparkles} size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-indigo-400 mb-0.5">
              {block.title || "PRACTICAL EXAMPLE"}
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed font-medium italic">{block.text}</p>
          </div>
        </motion.div>
      );

    case "reveal_answer":
      return (
        <GlassCard variant="premium" hover={false} className="p-5 my-5 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-secondary">
              {block.title || "Practice Question"}
            </h4>
            <button
              onClick={() => { setResolved(!revealed); markCompleted(); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <Icon icon={revealed ? EyeOff : Eye} size={14} />
              <span>{revealed ? "Hide Solution" : "Reveal Answer"}</span>
            </button>
          </div>
          
          <p className="text-sm text-text-primary font-medium mt-3 mb-1">
            {block.text}
          </p>

          <AnimatePresence initial={false}>
            {revealed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 pt-4 border-t border-border"
              >
                <div className="flex gap-2 text-emerald-400 font-semibold text-sm mb-1 items-center">
                  <Icon icon={CheckCircle2} size={16} />
                  <span>Solution:</span>
                </div>
                <p className="text-sm text-text-secondary bg-success/5 border border-success/15 rounded-lg p-3 leading-relaxed font-mono">
                  {block.explanation || "No explanation provided."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      );

    case "quiz":
      const isCorrect = selectedOption === block.answerIndex;
      return (
        <GlassCard variant="elevated" hover={false} className="p-6 my-6 border-primary/20 shadow-glow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Icon icon={HelpCircle} size={18} />
            </div>
            <span className="text-xs font-bold tracking-widest text-text-tertiary uppercase">CONCEPT CHALLENGE</span>
          </div>

          <h3 className="text-base font-bold text-text-primary mb-4 leading-snug">
            {block.question}
          </h3>

          <div className="space-y-2">
            {block.options?.map((option, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  disabled={quizSubmitted}
                  onClick={() => setSelectedOption(idx)}
                  className={cn(
                    "w-full text-left rounded-xl border p-4.5 text-sm transition-all flex items-center justify-between",
                    quizSubmitted
                      ? idx === block.answerIndex
                        ? "border-success bg-success/10 text-success font-semibold"
                        : isSelected
                          ? "border-danger bg-danger/10 text-danger"
                          : "border-border bg-bg-card opacity-50"
                      : isSelected
                        ? "border-primary bg-primary/10 text-text-primary shadow-glow-sm font-medium"
                        : "border-border bg-bg-card hover:border-border-hover hover:bg-bg-secondary/40 text-text-secondary"
                  )}
                >
                  <span>{option}</span>
                  {quizSubmitted && idx === block.answerIndex && (
                    <Icon icon={CheckCircle2} size={16} className="text-success shrink-0" />
                  )}
                  {quizSubmitted && isSelected && idx !== block.answerIndex && (
                    <Icon icon={XCircle} size={16} className="text-danger shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && !quizSubmitted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex justify-end">
              <button
                onClick={() => { setQuizSubmitted(true); markCompleted(); }}
                className="rounded-xl bg-primary text-white font-semibold text-xs px-5 py-2.5 shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
              >
                Submit Answer
              </button>
            </motion.div>
          )}

          {quizSubmitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-border space-y-2"
            >
              <div className="flex items-center gap-2">
                <Icon 
                  icon={isCorrect ? Trophy : AlertCircle} 
                  size={16} 
                  className={isCorrect ? "text-warning" : "text-text-tertiary"} 
                />
                <span className={cn("text-xs font-bold uppercase", isCorrect ? "text-success" : "text-text-tertiary")}>
                  {isCorrect ? "Correct!" : "Review Required"}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/40 border border-border p-3.5 rounded-xl font-mono">
                {block.explanation || "Well played! Remember the bidding rules shown here."}
              </p>
              <button
                onClick={() => {
                  setSelectedOption(null);
                  setQuizSubmitted(false);
                }}
                className="mt-2 text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 transition-colors"
              >
                <Icon icon={RotateCcw} size={12} /> Retry Quiz
              </button>
            </motion.div>
          )}
        </GlassCard>
      );

    case "flashcard":
      return (
        <div className="flex flex-col items-center justify-center my-6">
          <motion.div
            className="w-full max-w-sm h-64 cursor-pointer perspective-1000"
            onClick={() => { setCardFlipped(!cardFlipped); markCompleted(); }}
          >
            <motion.div
              animate={{ rotateY: cardFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative w-full h-full transform-style-3d duration-500"
            >
              {/* Front Side */}
              <GlassCard
                variant="premium"
                hover={false}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center backface-hidden border-primary/25"
              >
                <span className="text-xs uppercase tracking-widest text-primary font-bold mb-3">FLASHCARD</span>
                <p className="text-lg font-bold text-text-primary select-none px-4">
                  {block.front}
                </p>
                <span className="text-[10px] text-text-tertiary mt-6 flex items-center gap-1 select-none">
                  <Icon icon={Eye} size={12} /> Click to flip
                </span>
              </GlassCard>

              {/* Back Side */}
              <GlassCard
                variant="neural"
                hover={false}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center rotateY-180 backface-hidden border-accent/25"
              >
                <span className="text-xs uppercase tracking-widest text-accent font-bold mb-3">EXPLANATION</span>
                <p className="text-base font-semibold text-text-primary leading-relaxed select-none px-4">
                  {block.back}
                </p>
                <span className="text-[10px] text-text-tertiary mt-6 flex items-center gap-1 select-none">
                  <Icon icon={RotateCcw} size={12} /> Click to flip back
                </span>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      );

    case "interactive_board":
      if (!block.hands) return null;
      const handsArray = (["north", "south", "east", "west"] as const)
        .filter((pos) => (block.hands?.[pos] ?? []).length > 0)
        .map((pos) => ({
          position: pos,
          cards: block.hands?.[pos] ?? [],
          label: pos.charAt(0).toUpperCase() + pos.slice(1),
        }));
      return (
        <GlassCard variant="elevated" hover={false} className="p-4 my-5 border-emerald-500/20 bg-emerald-950/5">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">BOARD REPLAY SCENARIO</span>
            <Badge variant="success">Vulnerability: {block.vulnerability || "None"}</Badge>
          </div>
          <CardTable
            hands={handsArray}
            dealer={block.dealer}
            vulnerability={block.vulnerability}
            contract={block.contract}
          />
        </GlassCard>
      );

    case "divider":
      return (
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border/80" />
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Minimal Badge replacement helper since we imported from lucide-react or ui
function Badge({ variant, children, className }: { variant?: string; children: React.ReactNode; className?: string }) {
  const styles = variant === "success" 
    ? "bg-success/15 text-success border-success/30" 
    : "bg-warning/15 text-warning border-warning/30";
  return (
    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border", styles, className)}>
      {children}
    </span>
  );
}
