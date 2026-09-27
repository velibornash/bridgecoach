/**
 * Bridge Coach — Card play rules.
 *
 * Framework-free and side-effect free, like the rest of the engine. These are
 * the rules that govern *which card may be played*, kept out of the components
 * so they cannot be bypassed by a page that forgets to check.
 */

import { Position, Suit, nextPosition } from "./types";

/** The four suits, in the order the bidding box lists them. */
const ALL_SUITS: readonly Suit[] = ["C", "D", "H", "S"];

/**
 * The suits a player may legally play right now.
 *
 * The rule is one sentence: **if you hold the suit led, you must play it.**
 * Everything else follows from that.
 *
 * - Leading the trick (`leadSuit === null`): anything may be played.
 * - Must follow, and can: only the lead suit. A trump held back is not a legal
 *   option, which is the whole point of the rule — if you could ruff whenever you
 *   liked, nobody would ever have to establish a suit.
 * - Void in the suit led: **anything** may be played, including a trump. Being
 *   void entitles you to discard whatever you like, and a trump will of course
 *   win the trick. Refusing a legal discard would teach the rule backwards.
 *
 * `heldSuits` is the suits the player still holds, not their cards: a player who
 * has already played their last heart is void, and the caller must be able to
 * express that without re-deriving it.
 */
export function legalSuitsToPlay(
  heldSuits: readonly Suit[],
  leadSuit: Suit | null,
): readonly Suit[] {
  if (leadSuit === null) return ALL_SUITS;
  if (!heldSuits.includes(leadSuit)) return ALL_SUITS;
  return [leadSuit];
}

/** Whether playing a card of `cardSuit` is legal in this position. */
export function isLegalPlay(
  cardSuit: Suit,
  heldSuits: readonly Suit[],
  leadSuit: Suit | null,
): boolean {
  return legalSuitsToPlay(heldSuits, leadSuit).includes(cardSuit);
}

/**
 * The seat that makes the opening lead.
 *
 * ACBL **Law 41A**: *"After a bid, double or redouble has been followed by three
 * passes in rotation, the defender on presumed declarer's left makes the opening
 * lead."* Since each seat is followed by the player on their left, that is the
 * seat immediately after the declarer in `SEAT_ORDER`.
 *
 * ## The part that is easy to get wrong
 *
 * The common assumption is that the declarer plays second, immediately after the
 * lead. They do not. Law 41A's footnote is explicit: *"Declarer's first turn to
 * play is from dummy unless accepting an opening lead out of turn."* So the
 * opening trick runs:
 *
 *   1. declarer's left-hand opponent — the opening lead
 *   2. **dummy** (the declarer's partner)
 *   3. the declarer's right-hand opponent
 *   4. the declarer
 *
 * A South declarer is led to by **West**, and dummy (North) plays second. An
 * implementation that hands the second card to the declarer looks entirely
 * plausible and skips a card for every hand.
 */
export function openingLeader(declarer: Position): Position {
  return nextPosition(declarer);
}

/**
 * Seat order for the opening trick, in play order.
 *
 * Returned whole rather than derived by callers so the "declarer is fourth"
 * rule lives in one place, and so a test can assert the whole rotation.
 */
export function openingTrickOrder(declarer: Position): readonly Position[] {
  const leader = openingLeader(declarer);
  return [
    leader,
    nextPosition(leader),
    nextPosition(nextPosition(leader)),
    declarer,
  ];
}

/**
 * The reason a play was refused, phrased for the player.
 *
 * A refusal has to say what the rule was. A card that silently does nothing when
 * clicked looks like a broken app, and the player concludes the rule is a bug
 * rather than that they broke it.
 *
 * Returns `null` when the play is legal, so a caller can use it as the single
 * authority on both the decision and the message.
 */
export function playRefusalReason(
  cardSuit: Suit,
  heldSuits: readonly Suit[],
  leadSuit: Suit | null,
): string | null {
  if (isLegalPlay(cardSuit, heldSuits, leadSuit)) return null;
  return `You must follow suit — you still hold ${leadSuit}, so you cannot play ${cardSuit}.`;
}
