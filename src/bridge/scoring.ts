/**
 * Bridge Coach — Duplicate scoring.
 *
 * Framework-free and side-effect free, like the rest of the engine. No Prisma,
 * no database, no clock: given a contract, how many tricks were taken and who
 * was vulnerable, it returns the score. The database records the outcome, it
 * never computes it.
 *
 * ## Why every table here is spelled out in full
 *
 * Duplicate scoring is arithmetic, and arithmetic is where a bridge program
 * produces confident wrong answers. A hand with 9 tricks against 3NT is either
 * +170 or −50 and there is no third thing to look at: both are integers, both
 * render, and neither crashes. Nothing downstream can detect the error, so the
 * tables are written as literal, checkable rows rather than computed from a
 * formula that "should" work. A reader can compare each row against the Laws of
 * Duplicate Bridge without running anything.
 *
 * ## Where the tables come from
 *
 * Checked against the ACBL duplicate scoring tables (also published as the
 * "InstantScorer" scorecard) and Richard Pavlicek's duplicate scoring tables at
 * rpbridge.net. Two entries in particular were wrong in the first draft of this
 * file and are now covered by named regression tests, because both were
 * plausible and neither threw:
 *
 * - a doubled failure does not cost a flat 100 a trick. It is 100, 300, 500,
 *   800, 1100, and then +300 for each further undertrick;
 * - a doubled overtrick is a flat 100, not 100 for the first and 50 after. The
 *   two rules differ only from the second overtrick on.
 *
 * ## Which side is vulnerable
 *
 * `contractOutcome` wants the vulnerability of the side that *played* the
 * contract. A board can be `NS`, `EW` or `All` while the declarer sits in
 * either partnership, so `NS` and `EW` are ambiguous without a declarer and are
 * rejected rather than guessed — use `declarerVulnerability` to resolve them
 * first. Guessing here would mean a hand scored against the wrong side's
 * vulnerability, which is a 250-point error on most boards and would look
 * entirely reasonable in the UI.
 */

import { Contract, Position, Strain, Vulnerability } from "./types";

/** How a contract was multiplied. Derived from `Contract`; never stored twice. */
export type Doubling = "none" | "doubled" | "redoubled";

/** The doubling state of a contract. A redouble implies a preceding double. */
export function doublingOf(contract: Contract): Doubling {
  if (contract.redoubled) return "redoubled";
  if (contract.doubled) return "doubled";
  return "none";
}

const MAJOR_STRAINS: readonly Strain[] = ["S", "H"];
const MINOR_STRAINS: readonly Strain[] = ["C", "D"];

function isMajor(strain: Strain): boolean {
  return MAJOR_STRAINS.includes(strain);
}

/** Every strain that can be played, in the order the UI lists them. */
export const PLAYABLE_STRAINS: readonly Strain[] = ["C", "D", "H", "S", "NT"];

// ---------------------------------------------------------------------------
// Tricks required
// ---------------------------------------------------------------------------

/**
 * Tricks required for a contract, *before* doubling.
 *
 * The two rows that are not "one more than the level" are the ones people get
 * wrong: 5 of a minor needs 11 (one fewer than 5 of a major), and every
 * notrump level needs its own value — 1NT 7, 2NT 8, 3NT 9, 4NT 10, 5NT 10,
 * 6NT 12, 7NT 13. In particular 6NT is 12, not 9+3 or 13.
 */
function baseTricks(contract: Contract): number {
  const { level, strain } = contract;
  switch (level) {
    case 1:
      return 7;
    case 2:
      return 8;
    case 3:
      return 9;
    case 4:
      return 10;
    case 5:
      // 5 of a minor is 11; 5 of a major and 5NT are 10.
      return MINOR_STRAINS.includes(strain) ? 11 : 10;
    case 6:
      return 12;
    case 7:
      return 13;
    default:
      throw new Error(`Contract level must be 1-7, got ${String(level)}.`);
  }
}

interface Increments {
  /** Extra tricks required when doubled. */
  readonly doubled: number;
  /** Extra tricks required when redoubled. */
  readonly redoubled: number;
}

/**
 * Extra tricks required per contract, keyed `level` + `strain`.
 *
 * Worth reading in full rather than deriving, because the pattern is not
 * uniform. Doubled needs +1 at levels 1-2, +2 at 3-4, +2 minor / +3 major at
 * level 5, and +4 from 6 up. Redoubled is +2 almost everywhere — with two
 * exceptions: 3NT needs +4 (so 3NTXX needs all 13) and everything from 5 up
 * needs +4.
 *
 * The consequence worth knowing: a doubled contract above 6 tricks, and any
 * redoubled contract above 4 tricks, cannot be made at all. That is correct
 * bridge, not a bug — `contractOutcome` reports those as down rather than
 * pretending they are reachable.
 */
const TRICK_INCREMENTS: Readonly<Record<string, Increments>> = Object.freeze({
  "1C": { doubled: 1, redoubled: 2 },
  "1D": { doubled: 1, redoubled: 2 },
  "1H": { doubled: 1, redoubled: 2 },
  "1S": { doubled: 1, redoubled: 2 },
  "1NT": { doubled: 1, redoubled: 2 },
  "2C": { doubled: 1, redoubled: 2 },
  "2D": { doubled: 1, redoubled: 2 },
  "2H": { doubled: 1, redoubled: 2 },
  "2S": { doubled: 1, redoubled: 2 },
  "2NT": { doubled: 1, redoubled: 2 },
  "3C": { doubled: 2, redoubled: 2 },
  "3D": { doubled: 2, redoubled: 2 },
  "3H": { doubled: 2, redoubled: 2 },
  "3S": { doubled: 2, redoubled: 2 },
  "3NT": { doubled: 2, redoubled: 4 },
  "4C": { doubled: 2, redoubled: 2 },
  "4D": { doubled: 2, redoubled: 2 },
  "4H": { doubled: 2, redoubled: 2 },
  "4S": { doubled: 2, redoubled: 2 },
  "4NT": { doubled: 2, redoubled: 2 },
  "5C": { doubled: 2, redoubled: 4 },
  "5D": { doubled: 2, redoubled: 4 },
  "5H": { doubled: 3, redoubled: 4 },
  "5S": { doubled: 3, redoubled: 4 },
  "5NT": { doubled: 3, redoubled: 4 },
  "6C": { doubled: 4, redoubled: 4 },
  "6D": { doubled: 4, redoubled: 4 },
  "6H": { doubled: 4, redoubled: 4 },
  "6S": { doubled: 4, redoubled: 4 },
  "6NT": { doubled: 4, redoubled: 4 },
  "7C": { doubled: 4, redoubled: 4 },
  "7D": { doubled: 4, redoubled: 4 },
  "7H": { doubled: 4, redoubled: 4 },
  "7S": { doubled: 4, redoubled: 4 },
  "7NT": { doubled: 4, redoubled: 4 },
});

/** Multiplier applied to the contract's own trick value. */
const DOUBLING_MULTIPLIER: Readonly<Record<Doubling, number>> = Object.freeze({
  none: 1,
  doubled: 2,
  redoubled: 4,
});

/**
 * Tricks needed to make `contract`.
 *
 * Throws on an unknown contract rather than returning a plausible number: a bad
 * level that returned 7 would quietly mark a 7♣ as made.
 */
export function tricksRequired(contract: Contract): number {
  const strain = contract.strain;
  if (!PLAYABLE_STRAINS.includes(strain)) {
    throw new Error(`Not a strain: ${String(strain)}.`);
  }
  // baseTricks validates the level, so call it before the table lookup: a bad
  // level should say so rather than reporting a missing row.
  const base = baseTricks(contract);
  const increments = TRICK_INCREMENTS[`${contract.level}${strain}`]!;
  const doubling = doublingOf(contract);
  return base + (doubling === "none" ? 0 : increments[doubling]);
}

// ---------------------------------------------------------------------------
// Contract value (trick points)
// ---------------------------------------------------------------------------

/**
 * A notrump overtrick is worth the same as any other notrump trick after the
 * first. The 40-point first trick is already folded into the contract values
 * below, so it is deliberately not a separate constant here.
 */
const NOTRUMP_TRICK_VALUE = 30;

/**
 * Trick points the contract is worth when made, before any doubling.
 *
 * Notrump is the row that does not follow the pattern: 1NT is worth 20, the
 * same as 1♣, because the first notrump trick counts for 40 and the level-1
 * base of 20 is added to a trick worth 30. From there each further notrump
 * trick is 30, which is why 3NT is 50 and not 90.
 */
const CONTRACT_POINTS: Readonly<Record<string, number>> = Object.freeze({
  "1C": 20,
  "1D": 20,
  "1H": 30,
  "1S": 30,
  "1NT": 20,
  "2C": 40,
  "2D": 40,
  "2H": 50,
  "2S": 50,
  "2NT": 30,
  "3C": 70,
  "3D": 70,
  "3H": 80,
  "3S": 80,
  "3NT": 50,
  "4C": 100,
  "4D": 100,
  "4H": 130,
  "4S": 130,
  "4NT": 70,
  "5C": 110,
  "5D": 110,
  "5H": 160,
  "5S": 160,
  "5NT": 80,
  "6C": 140,
  "6D": 140,
  "6H": 190,
  "6S": 190,
  "6NT": 90,
  "7C": 170,
  "7D": 170,
  "7H": 220,
  "7S": 220,
  "7NT": 100,
});

/** Trick points a made contract earns, before doubling and bonuses. */
export function contractPoints(contract: Contract): number {
  const key = `${contract.level}${contract.strain}`;
  const points = CONTRACT_POINTS[key];
  if (points === undefined) {
    throw new Error(`No contract-value row for ${key}.`);
  }
  return points;
}

// ---------------------------------------------------------------------------
// Penalties
// ---------------------------------------------------------------------------

/**
 * Penalties for tricks down against a doubled contract, non-vulnerable.
 * Index 0 is one trick down.
 *
 * The first four are 100, 300, 500, 800 and every further undertrick adds 300.
 * This does *not* increase by a flat 100: a doubled contract that fails
 * accelerates, which is the entire reason a doubled slam is worth avoiding.
 */
const DOWN_DOUBLED_NOT_VULNERABLE: readonly number[] = Object.freeze([
  100, 300, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500,
]);

/**
 * The same ladder when the declaring side is vulnerable: 200, 500, 800, 1100,
 * then +300 each. It starts twice as high as the non-vulnerable ladder and
 * overtakes it from the second undertrick on.
 */
const DOWN_DOUBLED_VULNERABLE: readonly number[] = Object.freeze([
  200, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500, 3800,
]);

/**
 * Score for a contract that failed, as a negative number.
 *
 * An undoubled contract loses 50 a trick, or 100 a trick when vulnerable. A
 * doubled contract uses the ladder above, and a redoubled contract scores
 * exactly **twice** the doubled figure — the redouble ladder is not a third
 * table, it is the doubled one multiplied by two. Keying on `redoubled` instead
 * of `vulnerable` (an easy slip, since both are booleans on the same contract)
 * halves every failed redouble.
 */
export function penaltyScore(
  contract: Contract,
  tricksDown: number,
  vulnerable: boolean,
): number {
  if (!Number.isInteger(tricksDown) || tricksDown < 1 || tricksDown > 13) {
    throw new Error(
      `Tricks down must be an integer 1-13, got ${String(tricksDown)}.`,
    );
  }
  if (!contract.doubled && !contract.redoubled) {
    return vulnerable ? -100 * tricksDown : -50 * tricksDown;
  }
  const ladder = vulnerable ? DOWN_DOUBLED_VULNERABLE : DOWN_DOUBLED_NOT_VULNERABLE;
  const doubledPenalty = ladder[tricksDown - 1]!;
  return contract.redoubled ? -2 * doubledPenalty : -doubledPenalty;
}

// ---------------------------------------------------------------------------
// Vulnerability
// ---------------------------------------------------------------------------

/** The partnership a declarer belongs to, as a vulnerability key. */
export function sideOf(declarer: Position): "NS" | "EW" {
  return declarer === Position.NORTH || declarer === Position.SOUTH ? "NS" : "EW";
}

/**
 * Whether the declaring side was vulnerable on this board.
 *
 * Resolves the board-level `NS` / `EW` value into a simple yes/no. `contractOutcome`
 * deliberately does not accept a raw board vulnerability, because `NS` alone does
 * not say whether the declarer was the vulnerable side.
 */
export function declarerVulnerability(
  vulnerability: Vulnerability,
  declarer: Position,
): Vulnerability {
  if (vulnerability === Vulnerability.NONE) return Vulnerability.NONE;
  if (vulnerability === Vulnerability.ALL) return Vulnerability.ALL;
  return vulnerability === sideOf(declarer) ? Vulnerability.ALL : Vulnerability.NONE;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/** The bonuses a made contract can earn, each zero when not applicable. */
export interface ContractBonuses {
  /** 300 or 500 for reaching 100+ trick points. */
  readonly game: number;
  /** 50 for 50-99 trick points. */
  readonly partScore: number;
  /** 500/1000, or 750/1500 when vulnerable. Zero unless a small slam was made. */
  readonly smallSlam: number;
  /** 1000/1500. Zero unless a grand slam was made. */
  readonly grandSlam: number;
}

const NO_BONUSES: ContractBonuses = Object.freeze({
  game: 0,
  partScore: 0,
  smallSlam: 0,
  grandSlam: 0,
});

export interface ContractOutcome {
  /** Whether the contract was made. */
  readonly made: boolean;
  /** Net score for the declaring side: contract points, bonuses and overtricks. */
  readonly score: number;
  /** Human-readable one-liner, e.g. `3NT made +2 by 2 (+140)`. */
  readonly label: string;
  /** Tricks the contract needed. */
  readonly tricksRequired: number;
  /** Tricks actually taken. */
  readonly tricksTaken: number;
  /** Zero when made. */
  readonly tricksDown: number;
  /** Zero when down. */
  readonly overtricks: number;
  /** Trick points after doubling, before bonuses. Negative when down. */
  readonly contractPoints: number;
  readonly bonuses: ContractBonuses;
  /** Sum of `bonuses`, always 0 or more. */
  readonly bonusTotal: number;
  /** Whether the declaring side was vulnerable. */
  readonly vulnerable: boolean;
}

/** Short contract label such as `3NT` or `4♥XX`. */
export function contractLabel(contract: Contract): string {
  const strain = contract.strain === "NT" ? "NT" : contract.strain;
  const suffix = contract.redoubled ? "XX" : contract.doubled ? "X" : "";
  return `${contract.level}${strain}${suffix}`;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/**
 * Score a played contract.
 *
 * `vulnerability` must be the declaring side's vulnerability (`None` or `All`).
 * A board-level `NS`/`EW` is rejected, because the declarer's side is needed to
 * resolve it and guessing would silently score the wrong side.
 */
export function contractOutcome(
  contract: Contract,
  tricksTaken: number,
  vulnerability: Vulnerability,
): ContractOutcome {
  if (!Number.isInteger(tricksTaken) || tricksTaken < 0 || tricksTaken > 13) {
    throw new Error(`Tricks taken must be an integer 0-13, got ${String(tricksTaken)}.`);
  }
  if (vulnerability !== Vulnerability.NONE && vulnerability !== Vulnerability.ALL) {
    throw new Error(
      `contractOutcome needs the declaring side's vulnerability (None or All), got ` +
        `${String(vulnerability)}. Use declarerVulnerability(board, declarer) first.`,
    );
  }

  const vulnerable = vulnerability === Vulnerability.ALL;
  const required = tricksRequired(contract);
  const base = contractPoints(contract);
  const doubling = doublingOf(contract);
  const label = contractLabel(contract);

  if (tricksTaken < required) {
    const tricksDown = required - tricksTaken;
    const penalty = penaltyScore(contract, tricksDown, vulnerable);
    const bonuses = NO_BONUSES;
    const tricksText = `down ${tricksDown} (${tricksTaken} of ${required})`;
    return {
      made: false,
      score: penalty,
      label: `${label} ${tricksText} ${signed(penalty)}`,
      tricksRequired: required,
      tricksTaken,
      tricksDown,
      overtricks: 0,
      contractPoints: penalty,
      bonuses,
      bonusTotal: 0,
      vulnerable,
    };
  }

  const overtricks = tricksTaken - required;
  const multiplier = DOUBLING_MULTIPLIER[doubling];
  const made = base * multiplier;

  // Bonuses are decided on the multiplied value: 2♣X is 80, a part score, and
  // 3♣X is 140, a game. Using the undoubled value would award a game bonus to
  // a doubled 2♣.
  const bonuses: ContractBonuses = {
    game: made >= 100 ? (vulnerable ? 500 : 300) : 0,
    partScore: made >= 50 && made < 100 ? 50 : 0,
    smallSlam: contract.level === 6 ? (vulnerable ? 750 : 500) : 0,
    grandSlam: contract.level === 7 ? (vulnerable ? 1500 : 1000) : 0,
  };
  const bonusTotal = bonuses.game + bonuses.partScore + bonuses.smallSlam + bonuses.grandSlam;

  const overtrickPoints = overtrickScore(contract, overtricks, vulnerable);
  const score = made + bonusTotal + overtrickPoints;

  const overText = overtricks === 0 ? "made" : `+${overtricks} by ${overtricks}`;
  return {
    made: true,
    score,
    label: `${label} ${overText} ${signed(score)}`,
    tricksRequired: required,
    tricksTaken,
    tricksDown: 0,
    overtricks,
    contractPoints: made,
    bonuses,
    bonusTotal,
    vulnerable,
  };
}

/** Value of `overtricks` extra tricks, using the contract's own trick unit. */
function overtrickScore(
  contract: Contract,
  overtricks: number,
  vulnerable: boolean,
): number {
  if (overtricks === 0) return 0;
  const doubled = contract.doubled || contract.redoubled;

  if (doubled) {
    // A flat amount per extra trick: 100 when doubled and not vulnerable, 200
    // when vulnerable, and double that again for a redouble. It does not
    // taper - 100, 200, 300, 400 for successive overtricks, not 100 then 50
    // apiece. Getting this wrong is only visible from the second overtrick.
    const each = contract.redoubled
      ? vulnerable
        ? 400
        : 200
      : vulnerable
        ? 200
        : 100;
    return each * overtricks;
  }

  // Undoubled: every extra trick is worth one of the contract's own trick units
  // — 30 in a major or notrump, 20 in a minor, except 100 when vulnerable.
  const perTrick = vulnerable ? 50 : isMajor(contract.strain) || contract.strain === "NT"
    ? NOTRUMP_TRICK_VALUE
    : 20;
  return perTrick * overtricks;
}
