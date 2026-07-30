"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { mockAllNotes } from "@/services/mockData";
import type { LessonNote } from "@/types";

export default function NotesPage() {
  const [notes, setNotes] = useState<LessonNote[]>(mockAllNotes);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter((n) => n.text.toLowerCase().includes(q) || (n.lessonTitle || "").toLowerCase().includes(q));
  }, [notes, search]);

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  const togglePin = (id: string) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
    showToast("success", "Note pin toggled");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast("info", "Note deleted");
  };

  const startEdit = (note: LessonNote) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    setNotes((prev) => prev.map((n) => n.id === editingId ? { ...n, text: editText } : n));
    setEditingId(null);
    setEditText("");
    showToast("success", "Note updated");
  };

  const renderNote = (note: LessonNote) => (
    <motion.div
      key={note.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className={`rounded-xl border p-4 transition-all ${
        note.pinned ? "border-primary/20 bg-primary/5" : "border-border bg-bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => togglePin(note.id)}
          className={`mt-0.5 shrink-0 transition-colors ${note.pinned ? "text-primary" : "text-text-tertiary hover:text-primary"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={note.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {note.lessonTitle && (
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="default">{note.lessonTitle}</Badge>
            </div>
          )}

          {editingId === note.id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-secondary p-2 text-sm text-text-primary outline-none focus:border-primary/50 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={saveEdit}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{note.text}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-text-tertiary">
              {new Date(note.timestamp).toLocaleDateString()}
            </span>
            {editingId !== note.id && (
              <>
                <button
                  onClick={() => startEdit(note)}
                  className="text-[10px] text-text-tertiary hover:text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-[10px] text-text-tertiary hover:text-danger transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Notes</h1>
            <p className="text-sm text-text-tertiary mt-1">{notes.length} notes across all lessons</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-xl border border-border bg-bg-card py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <h2 className="text-sm font-semibold text-text-primary">Pinned ({pinned.length})</h2>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">{pinned.map(renderNote)}</AnimatePresence>
              </div>
            </div>
          )}

          {/* All notes */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">All Notes ({unpinned.length})</h2>
            {search && (
              <span className="text-[10px] text-text-tertiary">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {unpinned.length === 0 && pinned.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-tertiary">{search ? "No notes match your search." : "No notes yet."}</p>
                </motion.div>
              ) : (
                unpinned.map(renderNote)
              )}
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
}