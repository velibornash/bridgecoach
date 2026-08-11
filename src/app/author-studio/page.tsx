"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Icon } from "@/components/icons/Icon";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  Code,
  FileText,
  HelpCircle,
  Play,
  BookOpen,
  ClipboardCheck,
  Copy,
  ArrowUp,
  ArrowDown,
  Pencil,
  FolderOpen,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { LearningBlock, BlockType } from "@/components/learningEngine/types";
import { BlockRenderer } from "@/components/learningEngine/BlockRenderer";
import {
  AuthorStudioDraft,
  loadCurrentLesson,
  loadDrafts,
  persistDeleteDraft,
  persistDraft,
  saveCurrentLesson,
} from "@/services/authorStudioService";

function parseCards(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

const availableBlockTypes: { type: BlockType; label: string; icon: typeof FileText; description: string }[] = [
  { type: "heading", label: "Heading", icon: FileText, description: "Add a content section title" },
  { type: "paragraph", label: "Paragraph", icon: BookOpen, description: "Add explanatory text paragraph" },
  { type: "callout", label: "Pro Tip / Note", icon: Sparkles, description: "Highlight key bridge guidelines" },
  { type: "example", label: "Example", icon: ClipboardCheck, description: "Add step-by-step example bids" },
  { type: "hint", label: "Hint", icon: ChevronUp, description: "A collapsible hint for self-check" },
  { type: "reveal_answer", label: "Reveal Answer", icon: Eye, description: "Hidden solution the student reveals" },
  { type: "quiz", label: "Concept Quiz", icon: HelpCircle, description: "Interactive single-choice question" },
  { type: "flashcard", label: "Flashcard", icon: ChevronDown, description: "Tactile, flip-to-learn concept card" },
  { type: "interactive_board", label: "Board Scenario", icon: Play, description: "Four-handed board with a contract" },
  { type: "divider", label: "Divider", icon: ArrowDown, description: "Visual separator between sections" },
];

export default function ContentAuthorStudioPage() {
  const initial = useMemo(() => loadCurrentLesson(), []);
  const [lessonTitle, setLessonTitle] = useState(initial.title);
  const [blocks, setBlocks] = useState<LearningBlock[]>(initial.blocks);
  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "json">("builder");

  const [newBlockType, setNewBlockType] = useState<BlockType>("paragraph");
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [frontInput, setFrontInput] = useState("");
  const [backInput, setBackInput] = useState("");
  const [explanationInput, setExplanationInput] = useState("");

  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState<string[]>(["", "", ""]);
  const [quizAnswer, setQuizAnswer] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState("");

  const [boardNorth, setBoardNorth] = useState("");
  const [boardSouth, setBoardSouth] = useState("");
  const [boardEast, setBoardEast] = useState("");
  const [boardWest, setBoardWest] = useState("");
  const [boardDealer, setBoardDealer] = useState<"North" | "South" | "East" | "West">("North");
  const [boardContract, setBoardContract] = useState("");
  const [boardVulnerability, setBoardVulnerability] = useState<"None" | "All" | "NS" | "EW">("None");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<AuthorStudioDraft[]>(loadDrafts);
  const [draftsOpen, setDraftsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      saveCurrentLesson(lessonTitle, blocks);
    }, 600);
    return () => clearTimeout(t);
  }, [lessonTitle, blocks]);

  const resetBlockInputs = () => {
    setTextInput("");
    setTitleInput("");
    setFrontInput("");
    setBackInput("");
    setExplanationInput("");
    setQuizQuestion("");
    setQuizOptions(["", "", ""]);
    setQuizAnswer(0);
    setQuizExplanation("");
    setBoardNorth("");
    setBoardSouth("");
    setBoardEast("");
    setBoardWest("");
    setBoardDealer("North");
    setBoardContract("");
    setBoardVulnerability("None");
  };

  const handleOptionChange = (idx: number, value: string) => {
    setQuizOptions((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const startEdit = (block: LearningBlock) => {
    setEditingId(block.id);
    setNewBlockType(block.type);
    setTextInput(block.text ?? "");
    setTitleInput(block.title ?? "");
    setFrontInput(block.front ?? "");
    setBackInput(block.back ?? "");
    setExplanationInput(block.explanation ?? "");
    setQuizQuestion(block.question ?? "");
    setQuizOptions(block.options ?? ["", "", ""]);
    setQuizAnswer(block.answerIndex ?? 0);
    setQuizExplanation(block.explanation ?? "");
    setBoardNorth((block.hands?.north ?? []).join(" "));
    setBoardSouth((block.hands?.south ?? []).join(" "));
    setBoardEast((block.hands?.east ?? []).join(" "));
    setBoardWest((block.hands?.west ?? []).join(" "));
    setBoardDealer(block.dealer ?? "North");
    setBoardContract(block.contract ?? "");
    setBoardVulnerability(block.vulnerability ?? "None");
    setActiveTab("builder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildBlock = (): Partial<LearningBlock> => {
    const base: Partial<LearningBlock> = {
      id: editingId ?? `b-${Date.now()}`,
      type: newBlockType,
    };

    switch (newBlockType) {
      case "quiz":
        return {
          ...base,
          question: quizQuestion,
          options: quizOptions,
          answerIndex: quizAnswer,
          explanation: quizExplanation,
        };
      case "flashcard":
        return { ...base, front: frontInput, back: backInput };
      case "reveal_answer":
        return { ...base, text: textInput, title: titleInput || undefined, explanation: explanationInput };
      case "interactive_board":
        return {
          ...base,
          hands: {
            north: parseCards(boardNorth),
            south: parseCards(boardSouth),
            east: parseCards(boardEast),
            west: parseCards(boardWest),
          },
          dealer: boardDealer,
          contract: boardContract || undefined,
          vulnerability: boardVulnerability,
        };
      case "divider":
        return base;
      default:
        return { ...base, text: textInput, title: titleInput || undefined };
    }
  };

  const validateBlock = (data: Partial<LearningBlock>): string | null => {
    if (newBlockType === "quiz") {
      if (!quizQuestion.trim() || quizOptions.some((o) => !o.trim())) {
        return "Please fill in the quiz question and all options";
      }
    } else if (newBlockType === "flashcard") {
      if (!frontInput.trim() || !backInput.trim()) return "Please fill in both sides of the flashcard";
    } else if (newBlockType === "interactive_board") {
      if (!boardSouth.trim()) return "Please provide at least the South hand";
    } else if (newBlockType !== "divider" && !(data.text ?? "").trim()) {
      return "Please write some text content for the block";
    }
    return null;
  };

  const addOrUpdateBlock = () => {
    const data = buildBlock();
    const error = validateBlock(data);
    if (error) {
      showToast("error", error);
      return;
    }

    if (editingId) {
      setBlocks((prev) => prev.map((b) => (b.id === editingId ? (data as LearningBlock) : b)));
      showToast("success", "Block updated");
    } else {
      setBlocks((prev) => [...prev, data as LearningBlock]);
      showToast("success", `${newBlockType.toUpperCase()} block added`);
    }

    setEditingId(null);
    resetBlockInputs();
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetBlockInputs();
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) cancelEdit();
    showToast("info", "Block removed");
  };

  const duplicateBlock = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: `b-${Date.now()}` };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    showToast("success", "Block duplicated");
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const to = idx + dir;
      if (idx === -1 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const saveDraft = () => {
    if (blocks.length === 0) {
      showToast("error", "Nothing to save yet");
      return;
    }
    const title = lessonTitle.trim() || "Untitled Lesson";
    const draft: AuthorStudioDraft = { id: `d-${Date.now()}`, title, updatedAt: Date.now(), blocks };
    setDrafts(persistDraft(draft));
    setLessonTitle(title);
    showToast("success", "Draft saved to library");
  };

  const loadDraft = (draft: AuthorStudioDraft) => {
    setBlocks(draft.blocks);
    setLessonTitle(draft.title);
    setEditingId(null);
    resetBlockInputs();
    showToast("success", `Loaded "${draft.title}"`);
  };

  const deleteDraft = (id: string) => {
    setDrafts(persistDeleteDraft(id));
    showToast("info", "Draft deleted");
  };

  const newLesson = () => {
    setBlocks([]);
    setLessonTitle("Untitled Lesson");
    setEditingId(null);
    resetBlockInputs();
    showToast("info", "Started a new lesson");
  };

  const exportJSON = () => {
    const payload = { id: `lesson-${Date.now()}`, title: lessonTitle, blocks };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "lesson_schema_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("success", "Lesson schema exported successfully!");
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedBlocks: LearningBlock[] = Array.isArray(parsed) ? parsed : parsed.blocks;
        if (!Array.isArray(importedBlocks)) throw new Error("Invalid schema");
        setBlocks(importedBlocks);
        if (parsed.title) setLessonTitle(parsed.title);
        showToast("success", `Imported ${importedBlocks.length} blocks`);
      } catch {
        showToast("error", "Could not parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const needsText = ["heading", "paragraph", "callout", "example", "hint", "reveal_answer", "summary"].includes(newBlockType);
  const needsTitle = ["callout", "example", "hint", "reveal_answer"].includes(newBlockType);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon icon={Sparkles} className="text-primary animate-pulse" size={24} />
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Content Author Studio</h1>
              </div>
              <p className="text-sm text-text-tertiary">
                Build premium dynamic lessons, quizzes, and flashcards visually without code.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Button onClick={() => setDraftsOpen(!draftsOpen)} variant="secondary">
                  <Icon icon={FolderOpen} size={14} className="mr-1.5" /> Drafts ({drafts.length})
                  <Icon icon={draftsOpen ? ChevronUp : ChevronDown} size={12} className="ml-1.5" />
                </Button>
                <AnimatePresence>
                  {draftsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 w-80 max-h-72 overflow-y-auto rounded-xl border border-border bg-bg-card shadow-xl shadow-black/20 z-50"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="text-xs font-bold text-text-primary">Saved drafts</span>
                        <button onClick={newLesson} className="text-[10px] text-text-tertiary hover:text-text-primary">
                          New lesson
                        </button>
                      </div>
                      {drafts.length === 0 && (
                        <p className="px-3 py-4 text-xs text-text-tertiary text-center">No drafts saved yet</p>
                      )}
                      {drafts.map((draft) => (
                        <div key={draft.id} className="flex items-center gap-2 px-3 py-2 border-b border-border/60 hover:bg-bg-secondary/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text-primary truncate">{draft.title}</p>
                            <p className="text-[10px] text-text-tertiary">
                              {draft.blocks.length} blocks · {new Date(draft.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => loadDraft(draft)}
                            className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-primary/10 transition-all"
                            title="Load draft"
                          >
                            <Icon icon={Upload} size={13} />
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="p-1.5 text-text-tertiary hover:text-danger rounded-lg hover:bg-danger/10 transition-all"
                            title="Delete draft"
                          >
                            <Icon icon={Trash2} size={13} />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button onClick={saveDraft} variant="secondary">
                <Icon icon={Save} size={14} className="mr-1.5" /> Save Draft
              </Button>
              <label className="cursor-pointer">
                <span className="inline-flex items-center rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80 transition-colors">
                  <Icon icon={PlusCircle} size={14} className="mr-1.5" /> Import
                </span>
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
              </label>
              <Button onClick={exportJSON} variant="primary">
                <Icon icon={Code} size={14} className="mr-1.5" /> Export JSON
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-medium text-text-secondary block mb-1.5">Lesson Title</label>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g. Introduction to Major Suit Openings"
              className="w-full max-w-2xl bg-bg-secondary rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex gap-1 mb-6 border-b border-border pb-px">
            {(["builder", "preview", "json"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 text-sm font-semibold capitalize transition-all focus:outline-none ${
                  activeTab === tab ? "text-primary border-b-2 border-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === "builder" && (
                  <motion.div
                    key="builder-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {blocks.map((block, idx) => (
                      <GlassCard key={block.id} variant="secondary" hover={false} className="p-4">
                        <div className="flex gap-4 items-start group">
                          <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{block.type}</span>
                            <p className="text-sm text-text-primary mt-1 font-mono truncate">
                              {block.type === "quiz"
                                ? block.question
                                : block.type === "flashcard"
                                  ? `${block.front} → ${block.back}`
                                  : block.type === "interactive_board"
                                    ? `Board · ${block.contract || "no contract"}`
                                    : block.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => moveBlock(block.id, -1)}
                              disabled={idx === 0}
                              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-secondary transition-all disabled:opacity-30"
                              title="Move up"
                            >
                              <Icon icon={ArrowUp} size={14} />
                            </button>
                            <button
                              onClick={() => moveBlock(block.id, 1)}
                              disabled={idx === blocks.length - 1}
                              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-secondary transition-all disabled:opacity-30"
                              title="Move down"
                            >
                              <Icon icon={ArrowDown} size={14} />
                            </button>
                            <button
                              onClick={() => duplicateBlock(block.id)}
                              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-secondary transition-all"
                              title="Duplicate block"
                            >
                              <Icon icon={Copy} size={14} />
                            </button>
                            <button
                              onClick={() => startEdit(block)}
                              className="p-1.5 text-text-tertiary hover:text-primary rounded-lg hover:bg-primary/10 transition-all"
                              title="Edit block"
                            >
                              <Icon icon={Pencil} size={14} />
                            </button>
                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 text-text-tertiary hover:text-danger rounded-lg hover:bg-danger/10 transition-all"
                              title="Delete block"
                            >
                              <Icon icon={Trash2} size={14} />
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    ))}

                    {blocks.length === 0 && (
                      <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                        <Icon icon={FileText} size={32} className="text-text-tertiary mx-auto mb-2" />
                        <p className="text-sm text-text-secondary font-semibold">No blocks added yet</p>
                        <p className="text-xs text-text-tertiary mt-1">Select a block type on the right to get started.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "preview" && (
                  <motion.div
                    key="preview-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 bg-bg-secondary/20 rounded-2xl border border-border p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Icon icon={Eye} size={16} className="text-success" />
                      <span className="text-xs font-bold text-success uppercase tracking-widest">LIVE INTERACTIVE PREVIEW</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">{lessonTitle}</h1>
                    {blocks.map((block) => (
                      <BlockRenderer key={block.id} block={block} />
                    ))}
                    {blocks.length === 0 && (
                      <p className="text-sm text-text-tertiary text-center py-10">Add blocks to see a live preview.</p>
                    )}
                  </motion.div>
                )}

                {activeTab === "json" && (
                  <motion.div
                    key="json-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <pre className="bg-zinc-950 text-zinc-300 font-mono text-xs p-5 rounded-2xl border border-border overflow-x-auto max-h-[500px]">
                      {JSON.stringify({ title: lessonTitle, blocks }, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <GlassCard variant="primary" hover={false} className="p-5 border-primary/10">
                <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <Icon icon={PlusCircle} size={18} className="text-primary animate-pulse" />
                    <h3 className="font-bold text-text-primary text-sm">{editingId ? "Edit Block" : "Add Learning Block"}</h3>
                  </div>
                  {editingId && (
                    <button onClick={cancelEdit} className="text-[10px] text-text-tertiary hover:text-danger transition-colors">
                      Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary block">Block Type</label>
                    <select
                      value={newBlockType}
                      onChange={(e) => setNewBlockType(e.target.value as BlockType)}
                      className="w-full bg-bg-secondary rounded-lg border border-border p-2.5 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    >
                      {availableBlockTypes.map((t) => (
                        <option key={t.type} value={t.type}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {needsTitle && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary block">Block Label / Title</label>
                      <input
                        type="text"
                        placeholder="Optional custom title..."
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}

                  {needsText && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary block">Content Text</label>
                      <textarea
                        placeholder="Write block content text here..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={newBlockType === "heading" ? 1 : 4}
                        className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors resize-none font-mono"
                      />
                    </div>
                  )}

                  {newBlockType === "reveal_answer" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary block">Solution / Explanation</label>
                      <textarea
                        placeholder="Explain the correct answer..."
                        value={explanationInput}
                        onChange={(e) => setExplanationInput(e.target.value)}
                        rows={3}
                        className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors resize-none font-mono"
                      />
                    </div>
                  )}

                  {newBlockType === "flashcard" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary block">Front (Question)</label>
                        <textarea
                          placeholder="e.g. What does a 2♣ response ask?"
                          value={frontInput}
                          onChange={(e) => setFrontInput(e.target.value)}
                          rows={3}
                          className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors resize-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary block">Back (Answer)</label>
                        <textarea
                          placeholder="e.g. Stayman — asks opener for a 4-card major"
                          value={backInput}
                          onChange={(e) => setBackInput(e.target.value)}
                          rows={3}
                          className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors resize-none font-mono"
                        />
                      </div>
                    </>
                  )}

                  {newBlockType === "interactive_board" && (
                    <>
                      {(["North", "South", "East", "West"] as const).map((pos) => {
                        const value =
                          pos === "North" ? boardNorth
                            : pos === "South" ? boardSouth
                              : pos === "East" ? boardEast
                                : boardWest;
                        const set = pos === "North" ? setBoardNorth
                          : pos === "South" ? setBoardSouth
                            : pos === "East" ? setBoardEast
                              : setBoardWest;
                        return (
                          <div key={pos} className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary block">{pos} Hand</label>
                            <input
                              type="text"
                              placeholder="e.g. ♠A ♠K ♥Q2 ♦J85 ♣1043"
                              value={value}
                              onChange={(e) => set(e.target.value)}
                              className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors font-mono"
                            />
                          </div>
                        );
                      })}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-secondary block">Dealer</label>
                          <select
                            value={boardDealer}
                            onChange={(e) => setBoardDealer(e.target.value as typeof boardDealer)}
                            className="w-full bg-bg-secondary rounded-lg border border-border p-2 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                          >
                            {(["North", "South", "East", "West"] as const).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-secondary block">Vulnerability</label>
                          <select
                            value={boardVulnerability}
                            onChange={(e) => setBoardVulnerability(e.target.value as typeof boardVulnerability)}
                            className="w-full bg-bg-secondary rounded-lg border border-border p-2 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                          >
                            {(["None", "NS", "EW", "All"] as const).map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary block">Contract</label>
                        <input
                          type="text"
                          placeholder="e.g. 4♠ by South"
                          value={boardContract}
                          onChange={(e) => setBoardContract(e.target.value)}
                          className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {newBlockType === "quiz" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary block">Quiz Question</label>
                        <input
                          type="text"
                          placeholder="Is opening 1NT balanced?"
                          value={quizQuestion}
                          onChange={(e) => setQuizQuestion(e.target.value)}
                          className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary block">Options</label>
                        {quizOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Option ${idx + 1}...`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-1.5 text-xs text-text-primary outline-none focus:border-primary transition-colors mb-1"
                          />
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary block">Correct Option Index</label>
                        <select
                          value={quizAnswer}
                          onChange={(e) => setQuizAnswer(Number(e.target.value))}
                          className="w-full bg-bg-secondary rounded-lg border border-border p-2 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        >
                          {quizOptions.map((_, idx) => (
                            <option key={idx} value={idx}>Option {idx + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary block">Explanation</label>
                        <textarea
                          placeholder="Explain why this option is correct..."
                          value={quizExplanation}
                          onChange={(e) => setQuizExplanation(e.target.value)}
                          rows={2}
                          className="w-full bg-bg-secondary rounded-lg border border-border px-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors resize-none font-mono"
                        />
                      </div>
                    </>
                  )}

                  <Button onClick={addOrUpdateBlock} variant="primary" className="w-full py-2.5 text-xs">
                    <Icon icon={editingId ? CheckCircle2 : Plus} size={14} className="mr-1" />
                    {editingId ? "Update Block" : "Add to Schema"}
                  </Button>

                  {editingId && (
                    <button onClick={cancelEdit} className="w-full text-center text-[11px] text-text-tertiary hover:text-text-secondary transition-colors">
                      Discard changes
                    </button>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
