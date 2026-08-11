/**
 * Author Studio integration tests — draft CRUD through the storage service.
 */
import { describe, expect, it } from "vitest";
import {
  loadCurrentLesson,
  saveCurrentLesson,
  loadDrafts,
  persistDraft,
  persistDeleteDraft,
  type AuthorStudioDraft,
} from "@/services/authorStudioService";
import type { LearningBlock } from "@/components/learningEngine/types";

describe("author studio: current lesson", () => {
  it("seeds a starter lesson when nothing is saved", () => {
    const current = loadCurrentLesson();
    expect(current.title).toBe("Untitled Lesson");
    expect(current.blocks.length).toBeGreaterThan(0);
  });

  it("persists and reloads the working lesson", () => {
    saveCurrentLesson("Opener Basics", [{ id: "b1", type: "heading", text: "1NT Openings" }]);
    const current = loadCurrentLesson();
    expect(current.title).toBe("Opener Basics");
    expect(current.blocks[0].text).toBe("1NT Openings");
  });

  it("recovers from corrupt storage with the starter lesson", () => {
    window.localStorage.setItem("authorStudio.current", "{not json");
    const current = loadCurrentLesson();
    expect(current.title).toBe("Untitled Lesson");
  });
});

describe("author studio: drafts library", () => {
  const block: LearningBlock = { id: "b1", type: "paragraph", text: "Body" };
  const draft: AuthorStudioDraft = { id: "d-1", title: "Lesson A", updatedAt: 1, blocks: [block] };

  it("persists a draft to the top of the library", () => {
    const next = persistDraft(draft);
    expect(next[0].id).toBe("d-1");
    expect(loadDrafts()).toEqual(next);
  });

  it("caps the library at 20 drafts, newest first", () => {
    window.localStorage.removeItem("authorStudio.drafts");
    for (let i = 1; i <= 25; i++) {
      persistDraft({ id: `d-${i}`, title: `Lesson ${i}`, updatedAt: i, blocks: [block] });
    }
    const drafts = loadDrafts();
    expect(drafts.length).toBe(20);
    expect(drafts[0].id).toBe("d-25");
    expect(drafts[19].id).toBe("d-6");
  });

  it("deletes a draft from the library", () => {
    persistDraft(draft);
    const next = persistDeleteDraft("d-1");
    expect(next).toEqual([]);
    expect(loadDrafts()).toEqual([]);
  });
});
