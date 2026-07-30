"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/ui/Avatar";
import { mockUser } from "@/services/mockData";
import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learning-path", label: "Learn" },
  { href: "/quiz", label: "Quiz" },
  { href: "/xp", label: "XP" },
  { href: "/achievements", label: "Achievements" },
  { href: "/challenges", label: "Challenges" },
];

export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-bg-primary/60 backdrop-blur-xl sticky top-0 z-40">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-glow">
              <span className="text-sm font-bold text-white">♠</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-text-primary hidden sm:inline">
              Bridge Coach
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/xp" className="flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1.5 hover:bg-bg-secondary/80 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <span className="text-sm font-semibold text-text-primary">
                  {mockUser.xp.toLocaleString()}
                </span>
              </Link>
              <Link href="/challenges" className="flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1.5 hover:bg-bg-secondary/80 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                  <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
                <span className="text-sm font-semibold text-text-primary">
                  {mockUser.streak}
                </span>
              </Link>
            </div>
            <Link href="/profile">
              <Avatar name={`${mockUser.firstName} ${mockUser.lastName}`} size="sm" />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </header>
  );
}
