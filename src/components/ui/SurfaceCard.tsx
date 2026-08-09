"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'elevated' | 'glass' | 'premium' | 'neural' | 'walnut' | 'felt';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  border?: boolean;
}

export function SurfaceCard({ 
  className, 
  variant = 'primary', 
  padding = 'md',
  hover = true, 
  interactive = false,
  border = true,
  children,
  ...props 
}: SurfaceCardProps) {
  
  const variants = {
    primary: 'bg-bg-card/80 backdrop-blur-xl border-border shadow-lg shadow-black/10',
    secondary: 'bg-bg-card/60 backdrop-blur-lg border-border/60 shadow-md',
    elevated: 'bg-bg-card/90 backdrop-blur-2xl border-border/80 shadow-xl shadow-black/15',
    glass: 'bg-bg-primary/40 backdrop-blur-2xl border-border/40 shadow-lg shadow-black/5',
    premium: 'bg-gradient-to-br from-bg-card/90 via-bg-card/70 to-bg-card/90 backdrop-blur-2xl border-border/80 shadow-2xl shadow-primary/5',
    neural: 'bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 backdrop-blur-2xl border-primary/10 shadow-xl shadow-primary/5',
    walnut: 'bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-amber-900/20 backdrop-blur-xl border-amber-700/20 shadow-xl shadow-amber-900/5',
    felt: 'bg-gradient-to-br from-emerald-900/20 via-emerald-800/10 to-emerald-900/20 backdrop-blur-xl border-emerald-700/20 shadow-xl shadow-emerald-900/5'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8'
  };

  const borderClasses = border ? 'border' : 'border-0';

  return (
    <motion.div
      className={cn(
        'rounded-2xl transition-all duration-300 ease-out',
        variants[variant],
        paddings[padding],
        borderClasses,
        'relative overflow-hidden',
        interactive && 'cursor-pointer'
      )}
      whileHover={hover ? { scale: 1.015, y: -3 } : undefined}
      whileTap={{ scale: 0.99 }}
    >
      {/* Subtle shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}

// Specialized card components

export function LessonCard({ 
  title, 
  difficulty, 
  progress, 
  duration, 
  tags = [], 
  onClick,
  locked = false,
  lessonNumber,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  duration: string;
  tags: string[];
  onClick?: () => void;
  locked?: boolean;
  lessonNumber?: number;
}) {
  return (
    <SurfaceCard 
      variant="premium" 
      hover={!locked} 
      interactive={!locked}
      padding="md"
      className="group"
      onClick={locked ? undefined : onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            difficulty === 'Beginner' ? 'bg-emerald-400' :
            difficulty === 'Intermediate' ? 'bg-amber-400' : 'bg-rose-400'
          }`} />
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Lesson {lessonNumber || ''}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{duration}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map(tag => (
            <span 
              key={tag} 
              className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-tertiary">Progress</span>
          <span className="text-text-primary font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </div>

      {locked && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="font-medium">Locked</p>
            <p className="text-sm opacity-70">Complete previous lesson to unlock</p>
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

export function CourseCard({ 
  title, 
  description, 
  lessonsCount, 
  totalDuration, 
  difficulty,
  progress = 0,
  tags = [],
  image,
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  lessonsCount: number;
  totalDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  tags: string[];
  image?: string;
  onClick?: () => void;
}) {
  return (
    <SurfaceCard 
      variant="elevated" 
      hover 
      interactive
      padding="lg"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">{description}</p>
        </div>
        {image && (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.slice(0, 3).map(tag => (
          <span 
            key={tag} 
            className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-bg-secondary text-text-tertiary rounded-full">
            +{tags.length - 3}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-tertiary">Progress</span>
          <span className="font-medium text-text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{totalDuration}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-text-tertiary ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{lessonsCount} lessons</span>
        </div>
      </div>
    </SurfaceCard>
  );
}

export function AchievementCard({ 
  title, 
  description, 
  icon, 
  rarity = 'common',
  unlocked = true,
  unlockedAt,
  xpReward,
  progress,
  maxProgress,
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  xpReward?: number;
  progress?: number;
  maxProgress?: number;
  onClick?: () => void;
}) {
  const rarityStyles = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-indigo-500 to-indigo-600',
    epic: 'from-violet-500 to-violet-600',
    legendary: 'from-amber-500 to-amber-600'
  };

  const rarityColors = {
    common: 'text-gray-400',
    rare: 'text-indigo-400',
    epic: 'text-violet-400',
    legendary: 'text-amber-400'
  };

  const rarityBg = {
    common: 'bg-gray-400/10',
    rare: 'bg-indigo-400/10',
    epic: 'bg-violet-400/10',
    legendary: 'bg-amber-400/10'
  };

  return (
    <SurfaceCard 
      variant={unlocked ? 'premium' : 'secondary'} 
      hover={unlocked} 
      interactive={unlocked}
      padding="md"
      className={cn('relative overflow-hidden', !unlocked && 'grayscale opacity-60')}
    >
      {/* Rarity accent border */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          rarityStyles[rarity]
        )} 
      />

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0',
            `bg-gradient-to-br ${rarityStyles[rarity]}/20`,
            rarityColors[rarity]
          )}
        >
          {icon && <span className="text-2xl">{icon}</span>}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-text-primary truncate">{title}</h4>
            <span 
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded-full uppercase',
                rarityBg[rarity],
                rarityColors[rarity]
              )}
            >
              {rarity}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">{description}</p>

          {progress !== undefined && maxProgress && (
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Progress</span>
                <span className="text-text-primary font-medium">
                  {progress}/{maxProgress}
                </span>
              </div>
              <div className="h-1 rounded-full bg-bg-secondary overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress / maxProgress) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn("h-full rounded-full bg-gradient-to-r", rarityStyles[rarity])}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            {xpReward && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 6.91 8.26 12 2" />
                </svg>
                +{xpReward} XP
              </span>
            )}
            {unlockedAt && (
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {new Date(unlockedAt).toLocaleDateString()}
              </span>
            )}
            {!unlocked && (
              <span className="text-text-tertiary">Locked</span>
            )}
          </div>
        </div>

        {!unlocked && (
          <div className="flex-shrink-0 ml-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'primary',
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: { value: number; label: string; positive: boolean };
  color?: string;
  onClick?: () => void;
}) {
  return (
    <SurfaceCard 
      variant="elevated" 
      hover 
      interactive={!!onClick}
      padding="md"
      onClick={onClick}
      className="group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-text-primary group-hover:text-primary transition-colors">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', 'bg-primary/10 group-hover:bg-primary/20 transition-colors')}>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.positive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {trend.positive ? (
                <path d="M18 15l-6-6-6 6" />
              ) : (
                <path d="M6 9l6 6 6-6" />
              )}
            </svg>
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            <span className="text-text-tertiary">{trend.label}</span>
          </motion.div>
        </div>
      )}
    </SurfaceCard>
  );
}

export function PracticeCard({ 
  title, 
  hand, 
  contract, 
  difficulty, 
  tags = [],
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  hand: { north: string; south: string; east: string; west: string };
  contract: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  onClick?: () => void;
}) {
  return (
    <SurfaceCard 
      variant="felt" 
      hover 
      interactive
      padding="md"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
          <p className="text-sm text-text-tertiary mb-3">Contract: <span className="font-medium text-text-primary">{contract}</span></p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-[10px] font-medium bg-emerald-900/30 text-emerald-300 rounded-full border border-emerald-700/30">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {(['north', 'east', 'south', 'west'] as const).map((dir) => (
          <div key={dir} className="bg-bg-card/80 backdrop-blur rounded-lg p-2 text-center">
            <p className="text-xs text-text-tertiary capitalize">{dir}</p>
            <p className="text-sm font-mono font-medium text-text-primary">
              {hand[dir] || '--'}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-emerald-700/20">
        <span className="text-xs text-text-tertiary capitalize">{difficulty}</span>
        <button className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1">
          Play Hand
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </SurfaceCard>
  );
}

export function RecommendationCard({ 
  title, 
  reason, 
  type = 'lesson',
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  reason: string;
  type: 'lesson' | 'practice' | 'challenge' | 'article';
  onClick?: () => void;
}) {
  const typeIcons = {
    lesson: '📖',
    practice: '♠️',
    challenge: '🎯',
    article: '📄'
  };

  const typeIconStyles = {
    lesson: 'bg-indigo-500/10 text-indigo-400',
    practice: 'bg-emerald-500/10 text-emerald-400',
    challenge: 'bg-rose-500/10 text-rose-400',
    article: 'bg-amber-500/10 text-amber-400'
  };

  return (
    <SurfaceCard 
      variant="neural" 
      hover 
      interactive={!!onClick}
      padding="md"
      onClick={onClick}
      className="group"
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0',
          typeIconStyles[type]
        )}>
          <span className="text-xl">{typeIcons[type]}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full',
              typeIconStyles[type]
            )}>
              Recommended
            </span>
            <h4 className="font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
              {title}
            </h4>
          </div>
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">{reason}</p>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-tertiary">Based on your recent activity</span>
            <button className="text-primary hover:text-primary-hover font-medium flex items-center gap-1">
              View
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}