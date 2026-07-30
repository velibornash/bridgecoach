"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { Icon } from "@/components/icons/Icon";
import { cardHover } from "@/design-system/motion";

interface RecommendationCardProps {
  title: string;
  description: string;
  reason: string;
  href: string;
  tag?: string;
}

export function RecommendationCard({
  title,
  description,
  reason,
  href,
  tag = "Recommended",
}: RecommendationCardProps) {
  return (
    <Link href={href} className="block">
      <motion.div initial="rest" whileHover="hover" whileTap="tap" variants={cardHover}>
        <GlassCard variant="cloth" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={Sparkles} size={16} className="text-ai" />
            <span className="text-label text-ai">{tag}</span>
          </div>

          <Typography variant="sectionTitle" className="mb-1">
            {title}
          </Typography>
          <Typography variant="caption" className="mb-3 line-clamp-2">
            {description}
          </Typography>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary italic">{reason}</span>
            <Icon icon={ArrowRight} size={16} className="text-primary" />
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}
