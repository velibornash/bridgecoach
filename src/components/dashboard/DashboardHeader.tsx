"use client";

import { useState, useRef, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/ui/Avatar";
import { mockUser } from "@/services/mockData";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Icon } from "@/components/icons/Icon";
import { LayoutGrid, BookOpen, HelpCircle, MessagesSquare, Search, ChevronDown, ChevronRight, Compass, Layers, Target, BarChart3, Users, Bookmark, Pencil, Gift, Flame, Award, FileText, Crown, Settings, Mail, Bell, Menu, X, Zap, Star, Clock, Shield, Calendar, Tag, FolderOpen, Gift as GiftIcon, Trophy as TrophyIcon, ChevronDown as ChevronDownIcon, ChevronRight as ChevronRightIcon } from "lucide-react";
import Link from "next/link";

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/learning-path", label: "Learn", icon: BookOpen },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/community", label: "Community", icon: MessagesSquare },
];

const secondaryLinks = [
  { href: "/catalog", label: "Catalog", icon: Compass },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/missions", label: "Missions", icon: Target },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/notes", label: "Notes", icon: Pencil },
  { href: "/rewards", label: "Rewards", icon: GiftIcon },
  { href: "/xp", label: "XP", icon: Flame },
  { href: "/achievements", label: "Badges", icon: Award },
  { href: "/challenges", label: "Challenges", icon: Zap },
  { href: "/certificates", label: "Certificates", icon: FileText },
  { href: "/subscription", label: "Subscription", icon: Crown },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/email-preferences", label: "Emails", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-border bg-bg-primary/60 backdrop-blur-xl sticky top-0 z-40">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-glow">
              <span className="text-sm font-bold text-white">♠</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-text-primary hidden sm:inline">
              Bridge Coach
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
              >
                <Icon icon={link.icon} size={14} />
                {link.label}
              </Link>
            ))}

            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
              >
                More <Icon icon={ChevronDown} size={12} />
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 rounded-xl border border-border bg-bg-card shadow-xl shadow-black/20 py-1 z-50">
                  {secondaryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
                    >
                      <Icon icon={link.icon} size={14} className="text-text-tertiary" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/search"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
            >
              <Icon icon={Search} size={16} />
            </Link>
            <NotificationBell />
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link href="/xp" className="flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1.5 hover:bg-bg-secondary/80 transition-colors">
                <Icon icon={Flame} size={14} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">
                  {mockUser.xp.toLocaleString()}
                </span>
              </Link>
              <Link href="/challenges" className="flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1.5 hover:bg-bg-secondary/80 transition-colors">
                <Icon icon={Zap} size={14} className="text-warning" />
                <span className="text-sm font-semibold text-text-primary">
                  {mockUser.streak}
                </span>
              </Link>
            </div>
            <Link href="/profile">
              <Avatar name={`${mockUser.firstName} ${mockUser.lastName}`} size="sm" />
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
            >
              <Icon icon={menuOpen ? X : Menu} size={18} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1 max-h-[60vh] overflow-y-auto">
            <div className="px-3 mb-2">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">Navigate</p>
            </div>
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
              >
                <Icon icon={link.icon} size={16} />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border my-1" />
            <div className="px-3 mb-2">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">More</p>
            </div>
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 pl-7 text-sm font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
              >
                <Icon icon={link.icon} size={16} />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </header>
  );
}
