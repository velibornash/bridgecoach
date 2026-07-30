"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Typography } from "./Typography";
import { fadeUp } from "@/design-system/motion";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/icons/Icon";

export type EmptyStateVariant =
  | "lessons"
  | "friends"
  | "bookmarks"
  | "achievements"
  | "statistics"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  icon?: LucideIcon;
  className?: string;
}

const presets: Record<
  EmptyStateVariant,
  { title: string; description: string; actionLabel: string }
> = {
  lessons: {
    title: "Your journey starts here",
    description: "Begin with your first lesson and build your bridge foundation step by step.",
    actionLabel: "Start First Lesson",
  },
  friends: {
    title: "Two seats available",
    description: "Invite friends to your bridge table and learn together.",
    actionLabel: "Invite Friends",
  },
  bookmarks: {
    title: "Save your first lesson",
    description: "Bookmark lessons, videos, and articles to revisit them anytime.",
    actionLabel: "Browse Catalog",
  },
  achievements: {
    title: "Earn your first badge",
    description: "Complete lessons and challenges to unlock achievements and rewards.",
    actionLabel: "View Missions",
  },
  statistics: {
    title: "Complete lessons to unlock analytics",
    description: "Your skill profile, heatmap, and mastery charts will appear here.",
    actionLabel: "Start Learning",
  },
  generic: {
    title: "Nothing here yet",
    description: "Check back soon or explore other sections of the platform.",
    actionLabel: "Go to Dashboard",
  },
};

function BridgeTableIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-40 h-28 mx-auto opacity-80" aria-hidden="true">
      <ellipse cx="100" cy="70" rx="80" ry="50" fill="var(--color-cloth)" opacity="0.6" />
      <ellipse cx="100" cy="70" rx="70" ry="42" fill="none" stroke="var(--color-primary)" strokeOpacity="0.3" strokeWidth="1.5" />
      {/* North seat */}
      <rect x="88" y="8" width="24" height="16" rx="4" fill="var(--color-bg-secondary)" stroke="var(--color-border)" />
      {/* South seat */}
      <rect x="88" y="116" width="24" height="16" rx="4" fill="var(--color-bg-secondary)" stroke="var(--color-border)" />
      {/* East seat — occupied */}
      <rect x="168" y="62" width="16" height="24" rx="4" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeOpacity="0.4" />
      {/* West seat — empty, highlighted */}
      <rect x="16" y="62" width="16" height="24" rx="4" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
      {/* Card symbols */}
      <text x="100" y="75" textAnchor="middle" fill="var(--color-primary)" fontSize="14" opacity="0.5">♠ ♥ ♦ ♣</text>
    </svg>
  );
}

function SuitIllustration() {
  return (
    <div className="flex justify-center gap-3 text-2xl opacity-60" aria-hidden="true">
      <span className="text-red-400/70">♥</span>
      <span className="text-text-primary/50">♠</span>
      <span className="text-red-400/70">♦</span>
      <span className="text-text-primary/50">♣</span>
    </div>
  );
}

export function EmptyState({
  variant = "generic",
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  const preset = presets[variant];
  const resolvedTitle = title ?? preset.title;
  const resolvedDescription = description ?? preset.description;
  const resolvedAction = actionLabel ?? preset.actionLabel;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center text-center py-12 px-6 rounded-2xl border border-border bg-bg-card/50",
        className,
      )}
    >
      {variant === "friends" ? (
        <BridgeTableIllustration />
      ) : icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
          <Icon icon={icon} size={28} className="text-primary" />
        </div>
      ) : (
        <div className="mb-4">
          <SuitIllustration />
        </div>
      )}

      <Typography variant="sectionTitle" className="mb-2">
        {resolvedTitle}
      </Typography>
      <Typography variant="caption" className="max-w-sm mb-6">
        {resolvedDescription}
      </Typography>

      {onAction && (
        <Button variant="primary" onClick={onAction}>
          {resolvedAction}
        </Button>
      )}
    </motion.div>
  );
}
