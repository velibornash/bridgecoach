"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { mockNotifications } from "@/services/mockData";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white"
          >
            {unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-bg-card shadow-xl shadow-black/20 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">Notifications</span>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {mockNotifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-bg-secondary ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.read ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-0.5 line-clamp-1">{n.description}</p>
                    <p className="text-[9px] text-text-tertiary mt-0.5">{n.timestamp}</p>
                  </div>
                  {!n.read && (
                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}