import { describe, it, expect } from "vitest";
import {
  contractOutcome,
  contractPoints,
  tricksRequired,
  penaltyScore,
  declarerVulnerability,
  doublingOf,
  contractLabel,
} from "@/bridge/scoring";
import { Contract, Position, Strain, Vulnerability } from "@/bridge/types";

/** Build a contract, defaulting to undoubled. */
function c(level: number, strain: Strain, doubled = false, redoubled = false): Contract {
  return { level, strain, doubled, redoubled };
}

const ALL_STRAINS: Strain[] = ["C", "D", "H", "S", "NT"];

describe("scoring: tricks required", () => {
  // Expected values written out rather than computed, so a change to the
  // implementation cannot quietly change the expectation with it.
  const UNDOUBLED: Record<string, number> = {
    "1C": 7, "1D": 7, "1H": 7, "1S": 7, "1NT": 7,
    "2C": 8, "2D": 8, "2H": 8, "2S": 8, "2NT": 8,
    "3C": 9, "3D": 9, "3H": 9, "3S": 9, "3NT": 9,
    "4C": 10, "4D": 10, "4H": 10, "4S": 10, "4NT": 10,
    "5C": 11, "5D": 11, "5H": 10, "5S": 10, "5NT": 10,
    "6C": 12, "6D": 12, "6H": 12, "6S": 12, "6NT": 12,
    "7C": 13, "7D": 13, "7H": 13, "7S": 13, "7NT": 13,
  };

  it("covers all 35 level x strain combinations undoubled", () => {
    for (let level = 1; level <= 7; level += 1) {
      for (const strain of ALL_STRAINS) {
        const key = `${level}${strain}`;
        expect(tricksRequired(c(level, strain)), key).toBe(UNDOUBLED[key]);
      }
    }
  });

  it("gives every notrump level its own value", () => {
    // The row most often got wrong. 1NT 7, 2NT 8, 3NT 9, 6NT 12 - never 9, 10
    // or 13 for 6NT.
    expect(tricksRequired(c(1, "NT"))).toBe(7);
    expect(tricksRequired(c(2, "NT"))).toBe(8);
    expect(tricksRequired(c(3, "NT"))).toBe(9);
    expect(tricksRequired(c(4, "NT"))).toBe(10);
    expect(tricksRequired(c(5, "NT"))).toBe(10);
    expect(tricksRequired(c(6, "NT"))).toBe(12);
    expect(tricksRequired(c(7, "NT"))).toBe(13);
  });

  it("needs one more trick for 5 of a minor than for 5 of a major", () => {
    expect(tricksRequired(c(5, "C"))).toBe(11);
    expect(tricksRequired(c(5, "D"))).toBe(11);
    expect(tricksRequired(c(5, "H"))).toBe(10);
    expect(tricksRequired(c(5, "S"))).toBe(10);
  });

  const DOUBLED: Record<string, number> = {
    "1C": 8, "1D": 8, "1H": 8, "1S": 8, "1NT": 8,
    "2C": 9, "2D": 9, "2H": 9, "2S": 9, "2NT": 9,
    "3C": 11, "3D": 11, "3H": 11, "3S": 11, "3NT": 11,
    "4C": 12, "4D": 12, "4H": 12, "4S": 12, "4NT": 12,
    "5C": 13, "5D": 13, "5H": 13, "5S": 13, "5NT": 13,
    "6C": 16, "6D": 16, "6H": 16, "6S": 16, "6NT": 16,
    "7C": 17, "7D": 17, "7H": 17, "7S": 17, "7NT": 17,
  };

  it("covers all 35 combinations doubled", () => {
    for (let level = 1; level <= 7; level += 1) {
      for (const strain of ALL_STRAINS) {
        const key = `${level}${strain}`;
        expect(tricksRequired(c(level, strain, true)), key).toBe(DOUBLED[key]);
      }
    }
  });

  const REDOUBLED: Record<string, number> = {
    "1C": 9, "1D": 9, "1H": 9, "1S": 9, "1NT": 9,
    "2C": 10, "2D": 10, "2H": 10, "2S": 10, "2NT": 10,
    "3C": 11, "3D": 11, "3H": 11, "3S": 11,
    "3NT": 13, // the anomaly: 3NT redoubled needs every trick
    "4C": 12, "4D": 12, "4H": 12, "4S": 12, "4NT": 12,
    "5C": 15, "5D": 15, "5H": 14, "5S": 14, "5NT": 14,
    "6C": 16, "6D": 16, "6H": 16, "6S": 16, "6NT": 16,
    "7C": 17, "7D": 17, "7H": 17, "7S": 17, "7NT": 17,
  };

  it("covers all 35 combinations redoubled, including 3NT needing 13", () => {
    for (let level = 1; level <= 7; level += 1) {
      for (const strain of ALL_STRAINS) {
        const key = `${level}${strain}`;
        expect(tricksRequired(c(level, strain, true, true)), key).toBe(REDOUBLED[key]);
      }
    }
  });

  it("prefers the redouble row when both flags are set", () => {
    // A redouble implies a double, and a Contract may carry both booleans.
    expect(tricksRequired(c(3, "NT", true, true))).toBe(13);
    expect(tricksRequired(c(3, "NT", true))).toBe(11);
  });

  it("rejects a contract it cannot score instead of guessing", () => {
    expect(() => tricksRequired(c(0, "C"))).toThrow(/level must be 1-7/i);
    expect(() => tricksRequired(c(8, "C"))).toThrow(/level must be 1-7/i);
    expect(() => tricksRequired(c(3, "X" as Strain))).toThrow(/not a strain/i);
  });
});

describe("scoring: contract value", () => {
  it("scores notrump by its own trick count, not by the minor pattern", () => {
    // 1NT is worth the same as 1C: the 40-point first trick is built into the
    // level-1 base, so adding 30 per level is only right from 2NT up.
    expect(contractPoints(c(1, "C"))).toBe(20);
    expect(contractPoints(c(1, "NT"))).toBe(20);
    expect(contractPoints(c(2, "NT"))).toBe(30);
    expect(contractPoints(c(3, "NT"))).toBe(50);
    expect(contractPoints(c(4, "NT"))).toBe(70);
    expect(contractPoints(c(7, "NT"))).toBe(100);
  });

  it("scores minors 10 lower than majors, 20 lower at level 2", () => {
    expect(contractPoints(c(1, "C"))).toBe(20);
    expect(contractPoints(c(1, "H"))).toBe(30);
    expect(contractPoints(c(2, "C"))).toBe(40);
    expect(contractPoints(c(2, "S"))).toBe(50);
    expect(contractPoints(c(5, "C"))).toBe(110);
    expect(contractPoints(c(5, "S"))).toBe(160);
  });
});

describe("scoring: contractOutcome", () => {
  it("scores 3NT made and not made at the boundary", () => {
    // 3NT is 50 trick points, which is a part score, so it totals 100 - not the
    // 50 the raw contract value suggests. This is the single most common way to
    // under-score a 3NT.
    const made = contractOutcome(c(3, "NT"), 9, Vulnerability.NONE);
    expect(made.made).toBe(true);
    expect(made.tricksRequired).toBe(9);
    expect(made.contractPoints).toBe(50);
    expect(made.bonuses.partScore).toBe(50);
    expect(made.bonuses.game).toBe(0);
    expect(made.score).toBe(100);

    const down = contractOutcome(c(3, "NT"), 8, Vulnerability.NONE);
    expect(down.made).toBe(false);
    expect(down.tricksDown).toBe(1);
    expect(down.score).toBe(-50);
  });

  it("tests both sides of every threshold for a representative set", () => {
    // For each contract: exactly the tricks required is made, one fewer is down.
    // [contract, score when exactly met, score when one short]
    const cases: [Contract, number, number][] = [
      [c(1, "C"), 20, -50],
      [c(2, "H"), 100, -50], //  50 + part score
      [c(3, "NT"), 100, -50], //  50 + part score
      [c(4, "S"), 430, -50], //  130 + game
      [c(5, "C"), 410, -50], //  110 + game
      [c(6, "NT"), 640, -50], //   90 + part score + small slam
      [c(7, "S"), 1520, -50], // 220 + game + grand slam
      [c(3, "C", true), 440, -100], // doubled 140 + game; 1 down doubled = -100
      [c(4, "H", true, true), 820, -200], // redoubled 520 + game; 1 down redoubled = -200
    ];
    for (const [contract, madeScore, downScore] of cases) {
      const onTime = contractOutcome(contract, tricksRequired(contract), Vulnerability.NONE);
      expect(onTime.made, contractLabel(contract)).toBe(true);
      expect(onTime.score, contractLabel(contract)).toBe(madeScore);

      const oneShort = contractOutcome(
        contract,
        tricksRequired(contract) - 1,
        Vulnerability.NONE,
      );
      expect(oneShort.made, contractLabel(contract)).toBe(false);
      expect(oneShort.tricksDown, contractLabel(contract)).toBe(1);
      expect(oneShort.score, contractLabel(contract)).toBe(downScore);
    }
  });

  it("awards a game bonus at 100+ and a part score at 50-99", () => {
    // 4C = 100 trick points -> game, not part score.
    const game = contractOutcome(c(4, "C"), 10, Vulnerability.NONE);
    expect(game.bonuses.game).toBe(300);
    expect(game.bonuses.partScore).toBe(0);
    expect(game.score).toBe(400);

    // 2C = 40 -> neither.
    const low = contractOutcome(c(2, "C"), 8, Vulnerability.NONE);
    expect(low.bonuses.game).toBe(0);
    expect(low.bonuses.partScore).toBe(0);
    expect(low.score).toBe(40);

    // 3C = 70 -> part score.
    const part = contractOutcome(c(3, "C"), 9, Vulnerability.NONE);
    expect(part.bonuses.partScore).toBe(50);
    expect(part.score).toBe(120);
  });

  it("decides game and part score on the doubled value", () => {
    // 2C doubled is 80: a part score, so no game bonus despite 2C being one.
    const part = contractOutcome(c(2, "C", true), tricksRequired(c(2, "C", true)), Vulnerability.NONE);
    expect(part.contractPoints).toBe(80);
    expect(part.bonuses.game).toBe(0);
    expect(part.bonuses.partScore).toBe(50);
    expect(part.score).toBe(130);

    // 1C doubled is 40: still too low for a part score.
    const none = contractOutcome(c(1, "C", true), tricksRequired(c(1, "C", true)), Vulnerability.NONE);
    expect(none.contractPoints).toBe(40);
    expect(none.bonuses.partScore).toBe(0);
    expect(none.score).toBe(40);
  });

  it("multiplies by 2 when doubled and by 4 when redoubled", () => {
    const doubled = contractOutcome(
      c(2, "H", true),
      tricksRequired(c(2, "H", true)),
      Vulnerability.NONE,
    );
    expect(doubled.contractPoints).toBe(100); // 50 x 2
    expect(doubled.bonuses.game).toBe(300);
    expect(doubled.score).toBe(400);

    const redoubled = contractOutcome(
      c(2, "H", true, true),
      tricksRequired(c(2, "H", true, true)),
      Vulnerability.NONE,
    );
    expect(redoubled.contractPoints).toBe(200); // 50 x 4
    expect(redoubled.score).toBe(500);
  });

  it("awards slam bonuses only when the slam is made", () => {
    // 6NT is 90 trick points: a part score as well as a slam.
    const small = contractOutcome(c(6, "NT"), 12, Vulnerability.NONE);
    expect(small.bonuses.smallSlam).toBe(500);
    expect(small.bonuses.grandSlam).toBe(0);
    expect(small.bonuses.partScore).toBe(50);
    expect(small.score).toBe(90 + 50 + 500);

    const grand = contractOutcome(c(7, "S"), 13, Vulnerability.NONE);
    expect(grand.bonuses.grandSlam).toBe(1000);
    expect(grand.bonuses.game).toBe(300); // 220 is a game
    expect(grand.score).toBe(220 + 300 + 1000);

    // A small slam one short gets no slam bonus at all.
    const failedSlam = contractOutcome(c(6, "NT"), 11, Vulnerability.NONE);
    expect(failedSlam.made).toBe(false);
    expect(failedSlam.bonuses.smallSlam).toBe(0);
  });

  it("scores vulnerable contracts higher than the same contract notrump", () => {
    const vul = contractOutcome(c(4, "H"), 10, Vulnerability.ALL);
    const nonVul = contractOutcome(c(4, "H"), 10, Vulnerability.NONE);
    expect(vul.score).toBe(130 + 500);
    expect(nonVul.score).toBe(130 + 300);
    expect(vul.score - nonVul.score).toBe(200); // the game bonus, not 2x
    expect(vul.vulnerable).toBe(true);
    expect(nonVul.vulnerable).toBe(false);
  });

  it("scores vulnerable and non-vulnerable failures differently", () => {
    expect(contractOutcome(c(3, "NT"), 8, Vulnerability.NONE).score).toBe(-50);
    expect(contractOutcome(c(3, "NT"), 8, Vulnerability.ALL).score).toBe(-100);
  });

  it("applies the doubled penalty ladder, non-vulnerable", () => {
    // 1CX needs 8 tricks. Down 1, 2, 3, 4, 5 is 100, 300, 500, 800, 1100 - it
    // accelerates by 200, then 200, then 300, not a flat 100 a trick.
    expect(contractOutcome(c(1, "C", true), 7, Vulnerability.NONE).score).toBe(-100);
    expect(contractOutcome(c(1, "C", true), 6, Vulnerability.NONE).score).toBe(-300);
    expect(contractOutcome(c(1, "C", true), 5, Vulnerability.NONE).score).toBe(-500);
    expect(contractOutcome(c(1, "C", true), 4, Vulnerability.NONE).score).toBe(-800);
    expect(contractOutcome(c(1, "C", true), 3, Vulnerability.NONE).score).toBe(-1100);
  });

  it("applies the doubled penalty ladder when vulnerable", () => {
    // Down 1, 2, 3, 4, 5, 6 is 200, 500, 800, 1100, 1400, 1700. Twice the
    // non-vulnerable ladder for the first undertrick, more than twice by the
    // second.
    expect(contractOutcome(c(1, "C", true), 7, Vulnerability.ALL).score).toBe(-200);
    expect(contractOutcome(c(1, "C", true), 6, Vulnerability.ALL).score).toBe(-500);
    expect(contractOutcome(c(1, "C", true), 5, Vulnerability.ALL).score).toBe(-800);
    expect(contractOutcome(c(1, "C", true), 4, Vulnerability.ALL).score).toBe(-1100);
    expect(contractOutcome(c(1, "C", true), 3, Vulnerability.ALL).score).toBe(-1400);
    expect(contractOutcome(c(1, "C", true), 2, Vulnerability.ALL).score).toBe(-1700);
  });

  it("scores a redoubled failure at exactly twice the doubled one", () => {
    // 1CXX needs 9 tricks, so 8 taken is one down. The redouble ladder is not a
    // separate table: it is the doubled ladder times two. Reading the ladder by
    // `redoubled` instead of `vulnerable` would halve every one of these.
    expect(contractOutcome(c(1, "C", true, true), 8, Vulnerability.NONE).score).toBe(-200);
    expect(contractOutcome(c(1, "C", true, true), 8, Vulnerability.ALL).score).toBe(-400);
    expect(contractOutcome(c(1, "C", true, true), 7, Vulnerability.NONE).score).toBe(-600);
    expect(contractOutcome(c(1, "C", true, true), 7, Vulnerability.ALL).score).toBe(-1000);

    for (const vul of [Vulnerability.NONE, Vulnerability.ALL]) {
      for (let down = 1; down <= 6; down += 1) {
        const doubled = penaltyScore(c(1, "C", true), down, vul === Vulnerability.ALL);
        const redoubled = penaltyScore(c(1, "C", true, true), down, vul === Vulnerability.ALL);
        expect(redoubled, `down ${down} ${vul}`).toBe(2 * doubled);
      }
    }
  });

  it("scores overtricks in the contract's own trick unit", () => {
    // Undoubled: a minor extra trick is 20, a major or notrump extra is 30.
    // 2C is 40 and 2NT is 30, both below the 50 part-score threshold, so neither
    // earns a bonus; 2H is exactly 50 and does.
    expect(contractOutcome(c(2, "C"), 9, Vulnerability.NONE).score).toBe(40 + 20);
    expect(contractOutcome(c(2, "C"), 9, Vulnerability.NONE).bonuses.partScore).toBe(0);
    expect(contractOutcome(c(2, "H"), 9, Vulnerability.NONE).score).toBe(50 + 50 + 30);
    expect(contractOutcome(c(2, "NT"), 9, Vulnerability.NONE).score).toBe(30 + 30);
    // Vulnerable undoubled: 50 per extra trick whatever the strain.
    expect(contractOutcome(c(2, "C"), 9, Vulnerability.ALL).score).toBe(40 + 50);
  });

  it("scores a flat 100 per doubled overtrick, 200 when vulnerable", () => {
    // 2CX needs 9 tricks. The rate does not taper: two overtricks is +200, not
    // 100 + 50. Only the second overtrick can tell the two rules apart.
    const one = contractOutcome(c(2, "C", true), 10, Vulnerability.NONE);
    expect(one.overtricks).toBe(1);
    expect(one.score).toBe(80 + 50 + 100); // doubled + part score + overtrick

    const two = contractOutcome(c(2, "C", true), 11, Vulnerability.NONE);
    expect(two.overtricks).toBe(2);
    expect(two.score).toBe(80 + 50 + 200);

    const three = contractOutcome(c(2, "C", true), 12, Vulnerability.NONE);
    expect(three.score).toBe(80 + 50 + 300);

    expect(contractOutcome(c(2, "C", true), 10, Vulnerability.ALL).score).toBe(80 + 50 + 200);
    expect(contractOutcome(c(2, "C", true), 11, Vulnerability.ALL).score).toBe(80 + 50 + 400);
  });

  it("scores a redoubled overtrick at 200, or 400 when vulnerable", () => {
    // 1CXX needs 9 tricks. Redoubling doubles the overtrick rate again.
    const redoubled = contractOutcome(c(1, "C", true, true), 10, Vulnerability.NONE);
    expect(redoubled.score).toBe(80 + 50 + 200);

    const vul = contractOutcome(c(1, "C", true, true), 10, Vulnerability.ALL);
    expect(vul.score).toBe(80 + 50 + 400);
  });

  it("reports an impossible doubled slam as down rather than made", () => {
    // 6NT doubled needs 16 tricks, which do not exist.
    const doubled = c(6, "NT", true);
    expect(tricksRequired(doubled)).toBe(16);
    const best = contractOutcome(doubled, 13, Vulnerability.NONE);
    expect(best.made).toBe(false);
    expect(best.tricksDown).toBe(3);
    expect(best.score).toBe(-500); // 3 down, non-vulnerable doubled ladder
  });

  it("labels outcomes for a result screen", () => {
    expect(contractOutcome(c(3, "NT"), 9, Vulnerability.NONE).label).toBe("3NT made +100");
    expect(contractOutcome(c(3, "NT"), 10, Vulnerability.NONE).label).toBe("3NT +1 by 1 +130");
    expect(contractOutcome(c(3, "NT"), 8, Vulnerability.NONE).label).toBe(
      "3NT down 1 (8 of 9) -50",
    );
    expect(contractLabel(c(4, "H", true, true))).toBe("4HXX");
    expect(contractLabel(c(1, "C", true))).toBe("1CX");
    expect(contractLabel(c(5, "D"))).toBe("5D");
  });

  it("rejects an impossible number of tricks instead of clamping", () => {
    expect(() => contractOutcome(c(3, "NT"), 14, Vulnerability.NONE)).toThrow(/0-13/);
    expect(() => contractOutcome(c(3, "NT"), -1, Vulnerability.NONE)).toThrow(/0-13/);
    expect(() => contractOutcome(c(3, "NT"), 9.5, Vulnerability.NONE)).toThrow(/integer/);
  });

  it("refuses a board vulnerability it cannot resolve, pointing at the fix", () => {
    // "NS" does not say whether the declarer was the vulnerable side. Guessing
    // would score the wrong side - a large, plausible, invisible error.
    expect(() => contractOutcome(c(3, "NT"), 9, "NS")).toThrow(/declarerVulnerability/);
    expect(() => contractOutcome(c(3, "NT"), 9, "EW")).toThrow(/declarerVulnerability/);
  });
});

describe("scoring: vulnerability resolution", () => {
  it("resolves the declaring side's vulnerability from the board", () => {
    expect(declarerVulnerability(Vulnerability.NONE, Position.NORTH)).toBe(Vulnerability.NONE);
    expect(declarerVulnerability(Vulnerability.ALL, Position.WEST)).toBe(Vulnerability.ALL);
    expect(declarerVulnerability("NS", Position.SOUTH)).toBe(Vulnerability.ALL);
    expect(declarerVulnerability("NS", Position.WEST)).toBe(Vulnerability.NONE);
    expect(declarerVulnerability("EW", Position.EAST)).toBe(Vulnerability.ALL);
    expect(declarerVulnerability("EW", Position.NORTH)).toBe(Vulnerability.NONE);
  });

  it("feeds straight into contractOutcome", () => {
    // Declarer South on a board vulnerable to NS.
    // 3NT vulnerable is still only 50 trick points, so it is a part score, not a
    // game: 50 + 50 = 100. Vulnerability raises the game bonus, and this
    // contract never earns one.
    const vuln = declarerVulnerability("NS", Position.SOUTH);
    expect(vuln).toBe(Vulnerability.ALL);
    expect(contractOutcome(c(3, "NT"), 9, vuln).score).toBe(100);
    expect(contractOutcome(c(4, "H"), 10, vuln).score).toBe(130 + 500);
  });
});

describe("scoring: helpers", () => {
  it("derives the doubling state, treating redouble as implying double", () => {
    expect(doublingOf(c(2, "H"))).toBe("none");
    expect(doublingOf(c(2, "H", true))).toBe("doubled");
    expect(doublingOf(c(2, "H", true, true))).toBe("redoubled");
  });

  it("scores a straight failing contract as 50 a trick, or 100 when vulnerable", () => {
    expect(penaltyScore(c(3, "NT"), 2, false)).toBe(-100);
    expect(penaltyScore(c(3, "NT"), 2, true)).toBe(-200);
    expect(penaltyScore(c(3, "NT"), 1, false)).toBe(-50);
    expect(penaltyScore(c(3, "NT"), 1, true)).toBe(-100);
    expect(() => penaltyScore(c(3, "NT"), 0, false)).toThrow(/1-13/);
    expect(() => penaltyScore(c(3, "NT"), 14, false)).toThrow(/1-13/);
  });
});
