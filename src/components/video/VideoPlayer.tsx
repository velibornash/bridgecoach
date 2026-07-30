"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockCaptions } from "@/services/mockData";
import type { VideoState, Caption } from "@/types";

interface VideoPlayerProps {
  onProgress?: (pct: number) => void;
  onComplete?: () => void;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ onProgress, onComplete }: VideoPlayerProps) {
  const [state, setState] = useState<VideoState>({
    isPlaying: false, currentTime: 0, duration: 100,
    volume: 0.8, playbackRate: 1, isMuted: false, captionsEnabled: true,
  });
  const [showSpeed, setShowSpeed] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const togglePlay = useCallback(() => {
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }));
  }, []);

  useEffect(() => {
    if (state.isPlaying) {
      intervalRef.current = setInterval(() => {
        setState((s) => {
          const next = Math.min(s.currentTime + 0.5, s.duration);
          const pct = (next / s.duration) * 100;
          onProgress?.(pct);
          if (next >= s.duration) {
            clearInterval(intervalRef.current!);
            onComplete?.();
            return { ...s, currentTime: 0, isPlaying: false };
          }
          return { ...s, currentTime: next };
        });
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isPlaying, state.duration, onProgress, onComplete]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setState((s) => ({ ...s, currentTime: pct * s.duration }));
  }, []);

  const progressPct = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const currentCaption = mockCaptions.findLast(
    (c) => state.currentTime >= c.start && state.currentTime < c.end,
  );

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-black group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowSpeed(false); setShowVolume(false); }}
    >
      {/* Video area mock */}
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {!state.isPlaying && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={togglePlay}
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-xl shadow-primary/30 hover:bg-primary transition-all"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white ml-1">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </motion.button>
        )}

        {/* Captions */}
        <AnimatePresence>
          {state.captionsEnabled && currentCaption && (
            <motion.div
              key={currentCaption.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 max-w-[80%]"
            >
              <span className="inline-block rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white text-center backdrop-blur-sm">
                {currentCaption.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <motion.div
        initial={false}
        animate={{ opacity: hovering || state.isPlaying ? 1 : 0, y: hovering || state.isPlaying ? 0 : 10 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-3 px-4"
      >
        {/* Progress bar */}
        <div
          ref={progressBarRef}
          onClick={seek}
          className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer group/progress hover:h-2.5 transition-all"
        >
          <div
            className="h-full bg-primary transition-all duration-200 relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
            {state.isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>

          {/* Time */}
          <span className="text-[11px] text-white/70 font-mono min-w-[70px]">
            {fmt(state.currentTime)} / {fmt(state.duration)}
          </span>

          {/* Volume */}
          <div className="relative flex items-center">
            <button
              onClick={() => setState((s) => ({ ...s, isMuted: !s.isMuted }))}
              className="text-white/70 hover:text-white transition-colors"
            >
              {state.isMuted || state.volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex-1" />

          {/* Captions toggle */}
          <button
            onClick={() => setState((s) => ({ ...s, captionsEnabled: !s.captionsEnabled }))}
            className={`text-xs transition-colors ${state.captionsEnabled ? "text-primary" : "text-white/50 hover:text-white"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7.5 8.25h9m-9 3H12m-4.5 3h.008m8.992-3h.008m-.008 3h.008M3 4.5h18M3 19.5h18" />
            </svg>
          </button>

          {/* Speed control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeed(!showSpeed)}
              className="text-xs font-mono text-white/70 hover:text-white transition-colors"
            >
              {state.playbackRate}x
            </button>
            <AnimatePresence>
              {showSpeed && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full right-0 mb-2 rounded-lg border border-border bg-bg-card p-1 shadow-xl"
                >
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setState((prev) => ({ ...prev, playbackRate: s })); setShowSpeed(false); }}
                      className={`block w-full rounded px-3 py-1 text-left text-xs transition-colors ${
                        state.playbackRate === s ? "bg-primary text-white" : "text-text-secondary hover:bg-bg-secondary"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}