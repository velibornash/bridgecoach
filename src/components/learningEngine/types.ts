"use client";

import type { LucideIcon } from "lucide-react";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "callout"
  | "quote"
  | "divider"
  | "video"
  | "example"
  | "hint"
  | "reveal_answer"
  | "quiz"
  | "flashcard"
  | "interactive_board"
  | "interactive_auction"
  | "challenge"
  | "summary";

export interface LearningBlock {
  id: string;
  type: BlockType;
  // Text content for text, heading, callout, example, hint, summary, etc.
  text?: string;
  // For images and videos
  src?: string;
  alt?: string;
  // For interactive quiz block
  question?: string;
  options?: string[];
  answerIndex?: number;
  explanation?: string;
  // For flashcard block
  front?: string;
  back?: string;
  // For callouts and summaries
  title?: string;
  icon?: string;
  // For interactive boards and auctions (Sprints 53 & 55)
  hands?: {
    north?: string[];
    south?: string[];
    east?: string[];
    west?: string[];
  };
  dealer?: "North" | "South" | "East" | "West";
  vulnerability?: "None" | "All" | "NS" | "EW";
  biddingHistory?: string[];
  contract?: string;
  expectedBid?: string;
  expectedPlay?: string;
}

export interface UniversalLesson {
  id: string;
  title: string;
  episodeId: string;
  category: string;
  subcategory: string;
  xpReward: number;
  duration: string; // e.g. "10 mins"
  blocks: LearningBlock[];
}
