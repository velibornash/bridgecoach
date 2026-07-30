"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { mockSearchResults } from "@/services/mockData";
import Link from "next/link";

const categoryMeta: Record<string, { icon: string; color: string }> = {
  lesson: { icon: "📖", color: "text-blue-400" },
  topic: { icon: "📚", color: "text-emerald-400" },
  convention: { icon: "🃏", color: "text-violet-400" },
  video: { icon: "🎬", color: "text-rose-400" },
  faq: { icon: "❓", color: "text-amber-400" },
};

const allResults = Object.values(mockSearchResults).flat();

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    let filtered = allResults.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.match.toLowerCase().includes(q),
    );
    if (activeCategory) {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }
    return filtered;
  }, [query, activeCategory]);

  const categories = useMemo(() => {
    if (!query.trim()) return [];
    const counts: Record<string, number> = {};
    allResults.forEach((r) => {
      if (r.title.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase()) || r.match.toLowerCase().includes(query.toLowerCase())) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([key, count]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1) + "s",
      count,
      ...categoryMeta[key],
    }));
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      window.location.href = results[selectedIndex].href;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Search</h1>
          <p className="text-sm text-text-tertiary mb-6">Find lessons, topics, conventions, and more.</p>

          {/* Search input */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
              onKeyDown={handleKeyDown}
              placeholder="Search lessons, topics, conventions..."
              className="w-full rounded-xl border border-border bg-bg-card py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSelectedIndex(-1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filters */}
          <AnimatePresence>
            {query && categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none"
              >
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    activeCategory === null
                      ? "bg-primary text-white"
                      : "bg-bg-secondary text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  All ({results.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      activeCategory === cat.key
                        ? "bg-primary text-white"
                        : "bg-bg-secondary text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <Badge variant="default">{cat.count}</Badge>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {query && results.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-tertiary">No results found for &quot;{query}&quot;</p>
                  <p className="text-xs text-text-tertiary mt-1">Try different keywords or browse categories above.</p>
                </motion.div>
              )}

              {!query && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4"
                >
                  {Object.entries(mockSearchResults).map(([key, items]) => (
                    <button
                      key={key}
                      onClick={() => { setQuery(key === "lessons" ? "" : ""); setActiveCategory(key); }}
                      className="rounded-xl border border-border bg-bg-card p-4 text-center hover:border-primary/20 transition-all group"
                    >
                      <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">
                        {categoryMeta[key]?.icon || "📄"}
                      </span>
                      <span className="text-xs font-medium text-text-secondary capitalize">{key}s</span>
                      <span className="text-[10px] text-text-tertiary block mt-0.5">{items.length} items</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {results.map((result, i) => (
              <Link
                key={result.id}
                href={result.href}
                className={`block rounded-xl border p-4 transition-all hover:border-primary/20 hover:bg-bg-secondary/50 ${
                  i === selectedIndex ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-bg-card"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-secondary text-lg">
                    {categoryMeta[result.category]?.icon || "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary">{result.title}</h3>
                      <Badge variant="default">{result.category}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{result.description}</p>
                    <p className="text-[10px] text-text-tertiary mt-1.5">
                      Matches: <span className="text-primary/80">{result.match}</span>
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary shrink-0 mt-2">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </main>
    </div>
  );
}