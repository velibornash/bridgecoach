"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LessonNote } from "@/types";

interface NotesPanelProps {
  notes: LessonNote[];
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

export function NotesPanel({ notes, onAddNote, onDeleteNote, open, onToggle }: NotesPanelProps) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNote(text);
    setText("");
  };

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
          open
            ? "bg-primary/10 text-primary"
            : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
        Notes {notes.length > 0 && `(${notes.length})`}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Add a note..."
                  className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleAdd}
                  disabled={!text.trim()}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {notes.length === 0 && (
                <p className="text-xs text-text-tertiary italic">No notes yet. Add your first note above.</p>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="group flex items-start gap-2 rounded-lg bg-bg-secondary/50 p-2.5">
                    <p className="flex-1 text-xs text-text-secondary leading-relaxed">{note.text}</p>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
