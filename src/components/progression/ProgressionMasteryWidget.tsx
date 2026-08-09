"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import { Award, Compass, TrendingUp, Zap, HelpCircle } from "lucide-react";
import { ProgressEngine, ProgressionStats } from "./ProgressEngine";
import { GlassCard } from "@/components/ui/GlassCard";

interface ProgressionMasteryWidgetProps {
  stats?: ProgressionStats;
}

const defaultStats: ProgressionStats = {
  lessonsCompleted: 15,
  coursesCompleted: 3,
  handsSolved: 42,
  accuracy: 84,
  averageThinkingTime: 14.5,
  weakAreas: ["Slams", "Takeout Doubles"],
  strongAreas: ["Opening Bids", "Signals"],
  streak: 7,
  confidenceScore: 78,
  bridgeRating: 1540,
};

export function ProgressionMasteryWidget({ stats = defaultStats }: ProgressionMasteryWidgetProps) {
  const masteries = ProgressEngine.calculateMastery(stats);
  const calculatedRating = ProgressEngine.calculateBridgeRating(stats);
  const confidence = ProgressEngine.calculateConfidence(stats);

  return (
    <GlassCard variant="premium" hover={false} className="p-6 my-6 border-indigo-500/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon icon={Award} className="text-warning animate-pulse" size={20} />
            <h3 className="text-lg font-bold text-text-primary">Tactical Mastery</h3>
          </div>
          <p className="text-xs text-text-tertiary">Real-time analytical evaluation of your bridge skill profile</p>
        </div>
        <div className="flex gap-4 items-center self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Bridge ELO</span>
            <span className="text-2xl font-black text-text-primary tracking-tight font-mono">{calculatedRating}</span>
          </div>
          <div className="h-8 w-px bg-border/80" />
          <div className="text-right">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Confidence</span>
            <span className="text-2xl font-black text-primary tracking-tight font-mono">{confidence}%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Skills Track */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Icon icon={TrendingUp} size={14} className="text-primary" /> Skill Profile
          </h4>
          <div className="space-y-3.5">
            {masteries.map((skill, idx) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-text-secondary flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {skill.name}
                  </span>
                  <span className="text-text-primary font-bold font-mono">{skill.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.percentage}%` }}
                    transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Insights */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Icon icon={Compass} size={14} className="text-accent" /> Mastery Analytics
          </h4>
          
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-bg-card p-3.5 flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Icon icon={Zap} size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Strongest Competence</span>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{stats.strongAreas.join(" & ")}</p>
                <p className="text-xs text-text-tertiary mt-1">Excellent card selection and partner communication rhythm.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-3.5 flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <Icon icon={HelpCircle} size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Growth Opportunities</span>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{stats.weakAreas.join(" & ")}</p>
                <p className="text-xs text-text-tertiary mt-1">Practice recommended sequences to boost high-level accuracy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
