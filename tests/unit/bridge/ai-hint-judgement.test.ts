/**
 * T8 — the model that judges a bid is not shown the answer first.
 *
 * The failure mode this guards against is invisible by construction: a model
 * told the expected call agrees with it readily, which looks exactly like a model
 * reasoning well. So the only reliable check is to look at what was sent, which
 * is what these tests do.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { getBidHint, validateTacticalBid } from "@/services/aiCoachService";
import type { BidHintContext } from "@/services/aiCoachService";

const DRILL: BidHintContext = {
  hands: {
    N: ["SA", "HK", "DQ", "CJ"],
    E: ["S2", "H3", "D4", "C5"],
    S: ["SK", "HA", "D2", "C3"],
    W: ["S3", "H2", "D5", "C4"],
  },
  dealer: "N",
  vulnerability: "None",
  auction: ["1NT"],
  turn: "E",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Capture the body a service posts, and reply with a benign response. */
function captureRequest(response: unknown = { content: "because reasons" }) {
  const bodies: Array<Record<string, unknown>> = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
    return {
      ok: true,
      status: 200,
      json: async () => response,
    } as unknown as Response;
  });
  return bodies;
}

describe("the hint may know the expected call", () => {
  it("tells the coach the expected call, because that is what a hint is", async () => {
    // The hint goes to /api/coach as a prose prompt, so the answer is in the
    // text rather than a structured field. The judgement below goes to a
    // different endpoint with a structured body, and that is the one that must be
    // free of it.
    const bodies = captureRequest();
    await getBidHint({ ...DRILL, expectedNextBid: "2H" });
    expect(bodies).toHaveLength(1);
    expect(String(bodies[0]?.userPrompt)).toMatch(/expected call is: 2H/);
  });

  it("omits it when there is no expected call, rather than saying undefined", async () => {
    const bodies = captureRequest();
    await getBidHint({ ...DRILL });
    expect(String(bodies[0]?.userPrompt)).not.toMatch(/expected call/);
  });
});

describe("the judgement must not", () => {
  it("sends no expected call in the request body", async () => {
    const bodies = captureRequest({ correct: true, suggestedBid: "2H", explanation: "ok" });
    await validateTacticalBid({ ...DRILL, proposedBid: "2S" });

    expect(bodies).toHaveLength(1);
    const body = bodies[0]!;
    // The whole body, not a field list: if a future refactor serialises the
    // context wholesale, this is what catches it.
    expect(Object.keys(body).sort()).toEqual(
      ["auction", "dealer", "hands", "proposedBid", "turn", "vulnerability"].sort(),
    );
    // Nothing anywhere in it refers to an expected or correct call.
    expect(JSON.stringify(body)).not.toMatch(/expected|correct|answer|suggest/i);
  });

  it("cannot be given one, because the type has nowhere to put it", async () => {
    const bodies = captureRequest({ correct: true, suggestedBid: "", explanation: "" });
    // @ts-expect-error the judgement context deliberately has no such field
    await validateTacticalBid({ ...DRILL, proposedBid: "2S", expectedNextBid: "2H" });
    expect(JSON.stringify(bodies[0]!)).not.toMatch(/expected/i);
  });

  it("judges a bid that matches the book line", async () => {
    captureRequest({ correct: true, suggestedBid: "2H", explanation: "Five hearts." });
    const verdict = await validateTacticalBid({ ...DRILL, proposedBid: "2H" });
    expect(verdict?.correct).toBe(true);
  });

  it("judges a bid that does not, and can disagree with the drill", async () => {
    // The model may approve a call the expert line does not contain, and may
    // reject one it does. Both directions must work, or "judged by the AI" is
    // really "compared to the answer key".
    captureRequest({ correct: false, suggestedBid: "2S", explanation: "Better in spades." });
    const rejected = await validateTacticalBid({ ...DRILL, proposedBid: "1H" });
    expect(rejected?.correct).toBe(false);
    expect(rejected?.suggestedBid).toBe("2S");
  });
});
