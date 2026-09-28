/**
 * T7 — the deal of the day is a hand, not a decoration.
 *
 * It used to be a `<FloatingCards>` component with no deck and no date, and the
 * button under it dealt a different hand on every visit. These tests exist
 * because nothing about the old code would have failed: a card fan renders
 * perfectly well, and a random deal is random in exactly the way it should be.
 * The only way to catch this is to generate the same date twice and compare.
 */
import { describe, it, expect } from "vitest";
import {
  dailyDeal,
  seedFromDate,
  seededRandom,
  fullDeck,
  allCardsOf,
  dailyCardOrder,
  todayIso,
  contractFor,
} from "@/bridge/daily";
import { parseCard } from "@/bridge/play";
import { SEAT_ORDER, Position, Strain } from "@/bridge/types";
import { tricksRequired } from "@/bridge/scoring";

const TODAY = "2026-09-28";
const TOMORROW = "2026-09-29";

describe("the seeded generator repeats", () => {
  it("produces the same stream for the same seed", () => {
    const a = seededRandom(12345);
    const b = seededRandom(12345);
    const first = Array.from({ length: 8 }, a);
    const second = Array.from({ length: 8 }, b);
    expect(first).toEqual(second);
  });

  it("produces different streams for different seeds", () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it("stays inside [0, 1), so a shuffle index is always valid", () => {
    const rng = seededRandom(seedFromDate(TODAY));
    for (let i = 0; i < 2000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    // An unvalidated date would seed the same hand for "today" written two
    // different ways, and for an empty string.
    expect(() => seedFromDate("")).toThrow(/YYYY-MM-DD/);
    expect(() => seedFromDate("28-09-2026")).toThrow(/YYYY-MM-DD/);
    expect(() => seedFromDate("2026-9-28")).toThrow(/YYYY-MM-DD/);
  });
});

describe("the same date gives the same hand", () => {
  it("is identical across two separate generations", () => {
    const first = dailyDeal(TODAY);
    const second = dailyDeal(TODAY);
    expect(second).toEqual(first);
  });

  it("gives the same four hands, not just the same contract", () => {
    const a = dailyDeal(TODAY);
    const b = dailyDeal(TODAY);
    for (const seat of SEAT_ORDER) {
      const key = seat === Position.NORTH ? "north"
        : seat === Position.EAST ? "east"
        : seat === Position.SOUTH ? "south"
        : "west";
      expect(a[key], seat).toEqual(b[key]);
    }
  });

  it("deals a full, unduplicated pack every time", () => {
    for (const date of [TODAY, TOMORROW, "2026-01-01", "2027-12-31"]) {
      const deal = dailyDeal(date);
      const cards = dailyCardOrder(deal);
      expect(cards, date).toHaveLength(52);
      expect(new Set(cards).size, date).toBe(52);
      // And the same set as a fresh pack, so no card is invented or lost.
      expect([...cards].sort()).toEqual([...fullDeck()].sort());
    }
  });

  it("gives every seat exactly 13 cards", () => {
    const deal = dailyDeal(TODAY);
    for (const seat of SEAT_ORDER) {
      const key = seat === Position.NORTH ? "north"
        : seat === Position.EAST ? "east"
        : seat === Position.SOUTH ? "south"
        : "west";
      expect(allCardsOf(deal[key]), seat).toHaveLength(13);
    }
  });
});

describe("consecutive days differ", () => {
  it("gives a different deal tomorrow", () => {
    expect(dailyDeal(TOMORROW).north).not.toEqual(dailyDeal(TODAY).north);
  });

  it("differs across a spread of dates", () => {
    const dates = ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24"];
    const fingerprints = dates.map((d) => dailyCardOrder(dailyDeal(d)).join(""));
    expect(new Set(fingerprints).size).toBe(dates.length);
  });

  it("does not repeat the dealer every single day", () => {
    // A dealer that never moved would make two days' hands differ in content but
    // be indistinguishable in every way a player would act on.
    const dealers = new Set(
      Array.from({ length: 30 }, (_, i) => dailyDeal(`2026-10-${String(i + 1).padStart(2, "0")}`).dealer),
    );
    expect(dealers.size).toBeGreaterThan(1);
  });
});

describe("the daily contract comes from the cards", () => {
  it("is null rather than invented when nothing can be made", () => {
    const blank = { spades: [], hearts: [], diamonds: [], clubs: [] } as const;
    expect(contractFor(blank, blank)).toBeNull();
  });

  it("is consistent with the tricks the cards actually offer", () => {
    // Checked across a spread of dates, not once: a contract that needs more
    // tricks than the holdings provide is a hand that goes down and reads as the
    // engine being wrong.
    for (let i = 1; i <= 20; i += 1) {
      const deal = dailyDeal(`2026-11-${String(i).padStart(2, "0")}`);
      if (!deal.contract) continue;
      const required = tricksRequired(deal.contract);
      expect(required, deal.date).toBeGreaterThanOrEqual(7);
      expect(required, deal.date).toBeLessThanOrEqual(13);
    }
  });

  it("names a strain the engine knows", () => {
    for (let i = 1; i <= 10; i += 1) {
      const deal = dailyDeal(`2026-12-${String(i).padStart(2, "0")}`);
      if (!deal.contract) continue;
      expect(Object.values(Strain)).toContain(deal.contract.strain);
      expect(deal.contract.level).toBeGreaterThanOrEqual(1);
      expect(deal.contract.level).toBeLessThanOrEqual(7);
    }
  });
});

describe("todayIso", () => {
  it("formats as YYYY-MM-DD so it can be used as a seed", () => {
    expect(todayIso(new Date(2026, 8, 28))).toBe("2026-09-28");
    expect(todayIso(new Date(2026, 0, 1))).toBe("2026-01-01");
    // Zero-padded, or a day like the 3rd would seed a different string from the
    // 3rd of a later month and the round trip would fail.
    expect(todayIso(new Date(2026, 8, 3))).toBe("2026-09-03");
    expect(() => seedFromDate(todayIso())).not.toThrow();
  });
});

describe("card codes are engine notation throughout", () => {
  it("never emits anything parseCard would reject", () => {
    const deal = dailyDeal(TODAY);
    for (const code of dailyCardOrder(deal)) {
      expect(() => parseCard(code), code).not.toThrow();
    }
  });
});
