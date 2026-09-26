"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  fetchFriends,
  respondToFriendRequest,
  removeFriend,
  type Friend,
  type FriendsData,
} from "@/services/friendsService";
import { useApiResource } from "@/hooks/useApiResource";
import { showToast } from "@/components/ui/Toast";

/** Relative time, from a real ISO timestamp. */
function since(iso: string | null, online: boolean): string {
  if (online) return "Active now";
  if (!iso) return "No recent activity";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function FriendsPage() {
  // Real friends (Sprint 60). Previously ten invented people, whose
  // "mutualFriends" counts referenced a graph that did not exist.
  const { data, loading, error, reload } = useApiResource<FriendsData>(() => fetchFriends());
  const friends = data?.friends ?? [];
  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  const respond = async (id: string, action: "accept" | "decline") => {
    const result = await respondToFriendRequest(id, action);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    showToast("success", action === "accept" ? "Friend added." : "Request declined.");
    reload();
  };

  const [selected, setSelected] = useState<Friend | null>(null);

  const online = friends.filter((f: Friend) => f.online);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Friends</h1>
              <p className="text-sm text-text-tertiary mt-1">
                {loading
                  ? "Loading…"
                  : error
                    ? error
                    : `${online.length} online · ${friends.length} total`}
              </p>
            </div>
            <Button
              onClick={() => showToast("success", "Invite link copied!")}
            >
              + Invite
            </Button>
          </div>

          {incoming.length > 0 && (
            <section className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h2 className="text-sm font-bold text-text-primary">
                Requests ({incoming.length})
              </h2>
              <ul className="mt-3 space-y-2">
                {incoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <Avatar name={r.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {r.name}
                      </p>
                      <p className="text-[11px] text-text-tertiary">
                        Level {r.level} · {r.country}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => respond(r.id, "accept")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => respond(r.id, "decline")}>
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {outgoing.length > 0 && (
            <p className="mb-4 text-xs text-text-tertiary">
              {outgoing.length} request{outgoing.length === 1 ? "" : "s"} waiting for a
              reply.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Friend list */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {!loading && friends.length === 0 && (
                <p className="py-10 text-center text-sm text-text-tertiary">
                  No friends yet. Send a request from the leaderboard or a profile.
                </p>
              )}
              {friends.map((friend: Friend) => (
                  <motion.div
                    key={friend.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={() => setSelected(selected?.id === friend.id ? null : friend)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                      selected?.id === friend.id ? "border-primary/30 bg-primary/5" : "border-border bg-bg-card hover:bg-bg-secondary"
                    }`}
                  >
                    {/* Online indicator */}
                    <div className="relative shrink-0">
                      <Avatar name={friend.name} size="sm" />
                      {friend.online && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-bg-card" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">{friend.name}</p>
                        {friend.online && <span className="shrink-0 text-[10px] text-emerald-400 font-medium">Online</span>}
                      </div>
                      <p className="text-[11px] text-text-tertiary">
                        Level {friend.level} · {friend.country} · {since(friend.lastActive, friend.online)}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs font-bold text-text-primary">{friend.xp.toLocaleString()} XP</p>
                        <p className="text-[10px] text-text-tertiary">
                          {friend.mutualFriends} mutual · {friend.achievements} friends
                        </p>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-text-tertiary transition-transform ${selected?.id === friend.id ? "rotate-90" : ""}`}
                      >
                        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Profile preview */}
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-xl border border-border bg-bg-card p-5 h-fit sticky top-24"
                >
                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar name={selected.name} size="lg" />
                    <h3 className="text-base font-bold text-text-primary mt-3">{selected.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${selected.online ? "text-emerald-400" : "text-text-tertiary"}`}>
                        {selected.online ? "● Online" : `Last seen ${selected.lastActive}`}
                      </span>
                      <span className="text-text-tertiary">·</span>
                      <span className="text-xs text-text-tertiary">{selected.country}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-lg bg-bg-secondary p-2.5 text-center">
                      <p className="text-sm font-bold text-text-primary">{selected.level}</p>
                      <p className="text-[9px] text-text-tertiary">Level</p>
                    </div>
                    <div className="rounded-lg bg-bg-secondary p-2.5 text-center">
                      <p className="text-sm font-bold text-primary">{selected.xp.toLocaleString()}</p>
                      <p className="text-[9px] text-text-tertiary">XP</p>
                    </div>
                    <div className="rounded-lg bg-bg-secondary p-2.5 text-center">
                      <p className="text-sm font-bold text-amber-400">{selected.achievements}</p>
                      <p className="text-[9px] text-text-tertiary">Badges</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">Mutual Friends</span>
                      <span className="text-text-primary font-medium">{selected.mutualFriends}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button className="w-full" size="sm" onClick={() => showToast("info", "Challenge sent!")}>
                      Challenge to Duel
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => showToast("success", "Message sent!")}
                    >
                      Send Message
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-border bg-bg-card p-5 text-center h-fit sticky top-24"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                      <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-tertiary">Select a friend to view their profile</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
}
