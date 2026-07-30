"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MissionCard } from "./MissionCard";
import type { Mission, MissionCategory } from "@/types";

interface MissionSectionProps {
  missions: Mission[];
  category: MissionCategory;
}

export function MissionSection({ missions, category }: MissionSectionProps) {
  const completed = missions.filter((m) => m.completed).length;
  const total = missions.length;

  const mainMissions = missions.filter((m) => m.type === "main");
  const sideMissions = missions.filter((m) => m.type === "side");
  const bonusMissions = missions.filter((m) => m.type === "bonus");

  const renderGroup = (label: string, items: Mission[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          {label}
          <span className="ml-2 text-text-tertiary font-normal normal-case">({items.filter(m => m.completed).length}/{items.length})</span>
        </h4>
        <div className="space-y-3">
          {items.map((mission, i) => (
            <MissionCard key={mission.id} mission={mission} index={i} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Category header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary capitalize">{category} Missions</h2>
          <p className="text-xs text-text-tertiary mt-0.5">{completed}/{total} completed</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex h-2 w-2 rounded-full bg-primary" />
          <span className="text-[10px] text-text-tertiary">Main</span>
          <div className="flex h-2 w-2 rounded-full bg-violet-500" />
          <span className="text-[10px] text-text-tertiary">Side</span>
          <div className="flex h-2 w-2 rounded-full bg-warning" />
          <span className="text-[10px] text-text-tertiary">Bonus</span>
        </div>
      </div>

      <div className="space-y-6">
        {renderGroup("Main Missions", mainMissions)}
        {renderGroup("Side Missions", sideMissions)}
        {renderGroup("Bonus Missions", bonusMissions)}
      </div>
    </motion.div>
  );
}