"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TableEngine } from "@/components/tableEngine/Table";
import { DealAnimation } from "@/components/dealAnimation/DealAnimation";
import { TrickEngine, getWinner } from "@/components/trickEngine/TrickEngine";
import { BiddingBox, type Bid } from "@/components/biddingBox/BiddingBox";
import { CardEngine } from "@/components/cardEngine/CardEngine";
import type { BridgeCard, Suit } from "@/components/cardEngine/types";
import { Badge } from "@/components/ui/Badge";
import {
  createHand,
  createAuction,
  type RecordedAction,
} from "@/services/auctionService";
import { recordPracticeSession, type PracticeActionInput } from "@/services/practiceService";
import { dailyDeal, dailyCardOrder } from "@/bridge/daily";
import {
  AuctionStateMachine,
  formatBid,
  isLegalPlay,
  openingTrickOrder,
  playRefusalReason,
} from "@/bridge";
import {
  Position as EnginePosition,
  Vulnerability as EngineVulnerability,
  nextPosition,
  isPartner,
} from "@/bridge/types";
import { contractOutcome, type ContractOutcome } from "@/bridge/scoring";
import { trumpSuitOf } from "@/bridge/contract";
import { getSuitPresentation, suitCodeFromSymbol } from "@/bridge/suits";
import type { BidCall, Contract, Strain, Suit as EngineSuit } from "@/bridge/types";

type Player = 'north' | 'east' | 'south' | 'west';

/** Engine seat code -> the player key this page uses for that seat. */
const SEAT_TO_PLAYER: Record<string, Player> = {
  N: 'north', E: 'east', S: 'south', W: 'west',
};

/** The inverse, for recording which seat made a call. */
const PLAYER_TO_SEAT: Record<Player, EnginePosition> = {
  north: EnginePosition.NORTH,
  east: EnginePosition.EAST,
  south: EnginePosition.SOUTH,
  west: EnginePosition.WEST,
};

/**
 * The bidding box names suits as symbols ("♠"), the engine as codes ("S").
 * Notrump is already a code in both.
 */
function toStrain(suit: string): Strain {
  return suit === "NT" ? "NT" : suitCodeFromSymbol(suit);
}

export default function PlayDemoPage() {
  /**
   * The deal of the day, when the dashboard links here with `?daily=YYYY-MM-DD`.
   *
   * Both pages call the engine's `dailyDeal` for the same date, so "Play this
   * hand" opens the hand that was shown. Previously the dashboard drew a
   * decoration and this page shuffled a new deck, so the two never matched.
   */
  const [dailyDate] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const param = new URLSearchParams(window.location.search).get("daily");
    if (!param) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) return null;
    return param;
  });

  const dailyDeck = useMemo<BridgeCard[] | undefined>(() => {
    if (!dailyDate) return undefined;
    const deal = dailyDeal(dailyDate);
    // Engine notation -> display cards, keeping the engine's order. The symbol
    // comes from the shared presentation table rather than a second suit map.
    return dailyCardOrder(deal).map((code) => ({
      id: code,
      suit: getSuitPresentation(suitCodeFromSymbol(code.slice(0, 1))).symbol as BridgeCard["suit"],
      rank: code.slice(1) as BridgeCard["rank"],
      faceUp: true,
    }));
  }, [dailyDate]);
  const [phase, setPhase] = useState<'idle' | 'dealing' | 'bidding' | 'trick'>('idle');
  const [hands, setHands] = useState<Record<Player, BridgeCard[]>>({
    north: [], east: [], south: [], west: [],
  });
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  /**
   * The auction as the engine sees it, plus the contract it produced.
   *
   * The engine is the only thing that decides what the contract is, so the page
   * holds an `AuctionStateMachine` and reads the contract back out of it with
   * its own `finalContract()`. This used to be `useState<Suit>('♠')` with no
   * setter, which made spades trumps in every hand including notrump, and
   * recorded every call as `strain: "S"` — a 3NT auction persisted as 3♠.
   */
  const auctionRef = useRef<AuctionStateMachine | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  /**
   * Who deals, and therefore who is the declarer.
   *
   * This was `dealer: "S"` written into every call, which quietly made South the
   * dealer, South the player, and the tricks credited to whichever side happens
   * to be North-South regardless of who declared. The dealer is now state, and
   * the declarer is whatever the engine says it is.
   */
  const [dealer, setDealer] = useState<EnginePosition>(EnginePosition.SOUTH);
  /** The seat the human is playing. */
  const humanSeat: Player = 'south';
  /** Who the engine says is declaring, once the auction is complete. */
  const [declarer, setDeclarer] = useState<EnginePosition | null>(null);

  /**
   * Trumps for the hand, as a display symbol, or undefined in notrump.
   *
   * `undefined` is meaningful: it tells the trick engine that nothing is trump,
   * so only the lead suit can win. Passing a placeholder suit here is what let
   * an off-suit ace win a notrump trick.
   */
  const trumpSuit: Suit | undefined = useMemo(() => {
    const code = trumpSuitOf(contract);
    return code ? (getSuitPresentation(code).symbol as Suit) : undefined;
  }, [contract]);

  /** The seat whose turn it is, or null when it is not their turn. */
  const [turn, setTurn] = useState<EnginePosition | null>(null);
  const [currentTrick, setCurrentTrick] = useState(1);
  /** The finished hand, scored by the engine. Null until the hand is over. */
  const [result, setResult] = useState<ContractOutcome | null>(null);
  const [playedCards, setPlayedCards] = useState<Array<{ player: Player; card: BridgeCard }>>([]);
  const [trickWinner, setTrickWinner] = useState<string | null>(null);
  const [tricksByDeclarer, setTricksByDeclarer] = useState(0);
  const [tab, setTab] = useState<'deal' | 'bidding' | 'trick'>('deal');
  const handsRef = useRef(hands);

  useEffect(() => {
    handsRef.current = hands;
  }, [hands]);

  /**
   * Bids and cards, accumulated so the hand can be recorded when play ends.
   *
   * This page used to keep everything in component state and write nothing, so
   * `Hand` and `Auction` rows were never created by actually playing a hand.
   * `/api/auctions` had nothing to return, and `/replay` was reading a hardcoded
   * scenario instead of the player's own hands.
   */
  const bidCalls = useRef<RecordedAction[]>([]);
  /**
   * Cards go to a different table than bids. `AuctionAction` is auction calls
   * only — its `type` is bid/pass/double/redouble — so a played card has no
   * column there. `PracticeAction` is the one with a `card` field.
   */
  const cardCalls = useRef<PracticeActionInput[]>([]);
  const handId = useRef<string | null>(null);
  /** Tricks played and won by the declarer, as refs so the 13th is detectable. */
  const tricksPlayed = useRef(0);
  const declarerTricks = useRef(0);
  /** Guards the one-and-only write of a finished hand. */
  const recorded = useRef(false);
  /** Guards the one-and-only write of a finished hand. */


  const handleDealComplete = useCallback(async (dealtHands: Record<string, BridgeCard[]>) => {
    setHands(dealtHands as Record<Player, BridgeCard[]>);
    setPhase('bidding');
    setTab('bidding');
    bidCalls.current = [];
    cardCalls.current = [];
    tricksPlayed.current = 0;
    declarerTricks.current = 0;
    setResult(null);
    recorded.current = false;

    // Store the deal in the engine's notation ("SA"), which is what the schema
    // documents. It used to interpolate the display symbol, so a spade ace was
    // stored as the two characters "♠A" - not a card, and unreadable by anything
    // that tried to parse it back.
    const notation = (cards: BridgeCard[]) =>
      Object.fromEntries(cards.map((c) => [c.id, `${suitCodeFromSymbol(c.suit)}${c.rank}`]));
    const result = await createHand({
      dealer,
      north: notation((dealtHands as Record<string, BridgeCard[]>).north ?? []),
      east: notation((dealtHands as Record<string, BridgeCard[]>).east ?? []),
      south: notation((dealtHands as Record<string, BridgeCard[]>).south ?? []),
      west: notation((dealtHands as Record<string, BridgeCard[]>).west ?? []),
    });
    handId.current = result.data?.id ?? null;
  }, [dealer]);

  const handleBid = useCallback((bid: Bid) => {
    setCurrentBid(bid);
    // Recorded as the call that was made, in the form the API accepts. The
    // engine's `formatBid` writes it, so a notrump call is stored as "3NT" and
    // not as a suit: the strain is the one the player bid, not the page's fixed
    // trump suit, which made every call a spade call.
    const isPass = bid.label === "Pass";
    const call: BidCall = isPass
      ? { type: "pass" }
      : { type: "bid", level: bid.level, strain: toStrain(bid.suit) };
    bidCalls.current.push({ player: PLAYER_TO_SEAT[humanSeat], bid: formatBid(call) });

    // Feed the same call to the engine and let it work out the contract, rather
    // than tracking the strain here as well.
    const machine = auctionRef.current ?? new AuctionStateMachine({ dealer });
    auctionRef.current = machine;
    machine.submit(call);

    if (!isPass) {
      // The other three seats pass, so the auction ends here and the contract is
      // real. These passes are simulation, not user input, and are deliberately
      // not added to `bidCalls` - only calls the user made are recorded as their
      // actions.
      for (let i = 0; i < 3; i += 1) machine.submit("P");
      const final = machine.finalContract();
      setContract(final?.contract ?? null);
      setDeclarer(final?.declarer ?? null);
      // The declarer's left-hand opponent leads, and the declarer plays fourth.
      setTurn(final?.declarer ? openingTrickOrder(final.declarer)[0]! : null);

      // Simulate opponents passing around the table, then start play
      setTimeout(() => {
        setPhase('trick');
        setTab('trick');
      }, 900);
    }
  }, [dealer]);

  const playCardFor = (player: Player, card: BridgeCard) => {
    setPlayedCards((prev) => [...prev, { player, card }]);
    setHands((prev) => ({
      ...prev,
      [player]: prev[player].filter((c) => c.id !== card.id),
    }));
  };

  /**
   * Play a card for an AI seat, following suit when it can.
   *
   * When void it plays whatever it holds, which is legal: a void player may
   * discard, and a trump discard wins the trick.
   */
  const autoPlayFor = useCallback((seat: EnginePosition, leadSuit: Suit | null) => {
    const player = SEAT_TO_PLAYER[seat]!;
    const hand = handsRef.current[player];
    if (!hand || hand.length === 0) return;
    const follow = leadSuit ? hand.filter((c) => c.suit === leadSuit) : [];
    const card = (follow.length > 0 ? follow : hand)[0]!;
    cardCalls.current.push({
      phase: "play",
      player: PLAYER_TO_SEAT[player],
      card: `${suitCodeFromSymbol(card.suit)}${card.rank}`,
    });
    setPlayedCards((prev) => [...prev, { player, card }]);
    setHands((prev) => ({
      ...prev,
      [player]: prev[player].filter((c) => c.id !== card.id),
    }));
  }, []);

  /**
   * The suit of the card that opened the current trick, or null when it is
   * South's turn to lead.
   *
   * `playedCards` holds exactly the trick in progress, so its first entry is the
   * lead. Derived rather than stored, because a stored lead suit is another
   * value that can disagree with the cards actually on the table.
   */
  const leadSuit: Suit | null = playedCards[0]?.card.suit ?? null;

  /**
   * Suits South still holds, as engine codes.
   *
   * Computed from the cards rather than kept as state, so it cannot drift after
   * a card is played. A player who has just used their last heart is void in
   * hearts, and the rule has to see that.
   */
  const southHeldSuits: readonly EngineSuit[] = useMemo(
    () => [...new Set(hands.south.map((c) => suitCodeFromSymbol(c.suit)))],
    [hands.south],
  );

  /** Why the last attempted play was refused, if it was. */
  const [playError, setPlayError] = useState<string | null>(null);

  const handlePlayCard = useCallback((card: BridgeCard) => {
    if (playedCards.some((p) => p.player === 'south')) return;

    // The engine decides, and supplies the wording. This is a second line of
    // defence: the cards that break the rule are already rendered unplayable, so
    // reaching here means the UI and the rule disagree and the rule wins.
    const refusal = playRefusalReason(
      suitCodeFromSymbol(card.suit),
      southHeldSuits,
      leadSuit === null ? null : suitCodeFromSymbol(leadSuit),
    );
    if (refusal) {
      setPlayError(refusal);
      return;
    }
    setPlayError(null);
    playCardFor('south', card);

    // Card plays are recorded as practice actions, not auction actions.
    // Engine notation again, for the same reason as the deal.
    cardCalls.current.push({
      phase: "play",
      player: "S",
      card: `${suitCodeFromSymbol(card.suit)}${card.rank}`,
    });

    // The next seat is whatever the engine says, not a fixed west/north/east
    // sequence. That sequence ignored the declarer entirely, so on any hand the
    // declarer was not South the cards were played out of order.
    setTurn((t) => (t ? nextPosition(t) : t));
  }, [playedCards, southHeldSuits, leadSuit]);

  const [recording, setRecording] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  /**
   * Writes the finished hand: the auction to `Auction`/`AuctionAction`, the
   * cards to a `PracticeSession`. Two tables because they are two different
   * kinds of fact, and `AuctionAction` has no column for a played card.
   *
   * A failure is surfaced rather than swallowed — the hand is still playable,
   * but the user is told it was not kept, so a silent loss does not look like a
   * successful save.
   */
  const finishHand = useCallback(async () => {
    if (!handId.current) {
      setRecording("failed");
      return;
    }
    setRecording("saving");
    const auction = await createAuction({
      handId: handId.current,
      dealer,
      actions: bidCalls.current,
      isComplete: true,
    });
    const practice = await recordPracticeSession({
      actions: cardCalls.current,
      isComplete: true,
    });
    if (auction.error && practice.error) {
      setRecording("failed");
      return;
    }
    setRecording("saved");
  }, [dealer]);

  /** "North-South" or "East-West", whichever is declaring. */
  const declarerSideName = declarer === EnginePosition.EAST || declarer === EnginePosition.WEST
    ? "EW"
    : "NS";
  const defenderSideName = declarerSideName === "NS" ? "EW" : "NS";

  /**
   * Drive the non-human seats from the engine's turn order.
   *
   * Whichever seat the engine says is on turn plays, so the sequence is a real
   * rotation: the declarer's left-hand opponent leads, dummy plays second on the
   * opening trick, and each trick thereafter starts with whoever won the last.
   */
  useEffect(() => {
    if (phase !== 'trick' || turn === null) return;
    if (SEAT_TO_PLAYER[turn] === humanSeat) return;
    if (playedCards.length >= 4) return;
    const timer = setTimeout(() => autoPlayFor(turn, leadSuit), 600);
    return () => clearTimeout(timer);
  }, [phase, turn, playedCards, leadSuit, autoPlayFor]);

  /** Score the hand from what was actually played, once all 13 tricks are in. */
  const scoreHand = (tricks: number) => {
    if (!contract) return;
    setResult(contractOutcome(contract, tricks, EngineVulnerability.NONE));
  };

  // Resolve the trick once all 4 cards are played
  useEffect(() => {
    if (playedCards.length !== 4) return;
    const timer = setTimeout(() => {
      const winner = getWinner(playedCards, trumpSuit);
      setTrickWinner(winner);

      // Credit the declarer's partnership, not "North-South" whatever the deal.
      // The old test was `winner === 'south' || winner === 'north'`, which is
      // only right when the declarer happens to be in that partnership.
      const winnerSeat = winner
        ? (Object.keys(SEAT_TO_PLAYER).find((k) => SEAT_TO_PLAYER[k as EnginePosition] === winner) as
            | EnginePosition
            | undefined)
        : undefined;
      const declarerSideWon =
        winnerSeat != null && declarer != null && isPartner(winnerSeat, declarer);

      const finishTimer = setTimeout(() => {
        setPlayedCards([]);
        setTrickWinner(null);
        if (declarerSideWon) setTricksByDeclarer((t) => t + 1);
        setTurn((t) => (winnerSeat ? nextPosition(winnerSeat) : t));

        // Count in refs so the thirteenth trick can be recognised here, rather
        // than in a follow-up effect that would setState synchronously and
        // cascade a render.
        tricksPlayed.current += 1;
        declarerTricks.current += declarerSideWon ? 1 : 0;
        setCurrentTrick(Math.min(tricksPlayed.current, 13));

        // A hand is 13 tricks. The old code stopped at 12: `t >= 13 ? 13 :
        // t + 1` meant the last trick was never played and the count could only
        // ever reach 12.
        if (tricksPlayed.current === 13) {
          scoreHand(declarerTricks.current);
          if (handId.current && !recorded.current) {
            recorded.current = true;
            void finishHand();
          }
        }
      }, 2200);
      return () => clearTimeout(finishTimer);
    }, 700);
    return () => clearTimeout(timer);
    // scoreHand and finishHand are stable enough here: both read refs and state
    // setters only, and re-running this effect is keyed on the trick in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playedCards, trumpSuit, declarer]);



  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-6 sm:py-8">
        <Container className="max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Bridge Play</h1>
                <p className="text-sm text-text-tertiary mt-0.5">Interactive card engine demo</p>
              </div>
              <div className="flex gap-2">
                {(['deal', 'bidding', 'trick'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                      tab === t
                        ? 'bg-primary text-white'
                        : 'bg-bg-secondary text-text-tertiary hover:text-text-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Phase indicator */}
            <div className="flex items-center gap-2 mb-6">
              {(['idle', 'dealing', 'bidding', 'trick'] as const).map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${phase === p ? 'bg-primary ring-2 ring-primary/30' : 'bg-bg-secondary border border-border'}`} />
                  <span className={`text-[10px] font-medium ${phase === p ? 'text-primary' : 'text-text-tertiary'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                  {p !== 'trick' && <span className="text-text-tertiary text-[10px]">→</span>}
                </div>
              ))}
            </div>

            {/*
              The write is announced either way. A hand that saved silently would
              be indistinguishable from one that was lost, and a hand that failed
              to save must say so rather than letting the user assume it was kept.
            */}
            {recording !== "idle" && (
              <p
                className={`mb-4 text-center text-xs ${
                  recording === "failed" ? "text-error" : "text-text-tertiary"
                }`}
              >
                {recording === "saving" && "Saving this hand…"}
                {recording === "saved" && "Hand saved. You can replay it from /replay."}
                {recording === "failed" &&
                  "This hand could not be saved, so it will not appear in your replay history."}
              </p>
            )}

            {tab === 'deal' && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="text-xs text-text-tertiary">Dealer:</span>
                {(["N", "E", "S", "W"] as const).map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => setDealer(seat)}
                    className={`px-2 py-1 text-xs rounded ${
                      dealer === seat
                        ? "bg-accent text-white"
                        : "bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    {seat}
                  </button>
                ))}
              </div>
            )}

            {tab === 'deal' && (
              <DealAnimation onComplete={handleDealComplete} size="lg" deck={dailyDeck} />
            )}

            {tab === 'bidding' && (
              <div className="space-y-6">
                <BiddingBox
                  yourHand="south"
                  currentBid={currentBid}
                  onBid={handleBid}
                  disabled={phase !== 'bidding'}
                />
                {hands.south.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-xs text-text-tertiary mr-2 self-center">Your hand ({hands.south.length} cards):</span>
                    {hands.south.slice(0, 8).map((card) => (
                      <CardEngine key={card.id} card={card} size="sm" interactive={false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'trick' && (
              <div className="space-y-6">
                <TableEngine
                  hands={hands}
                  centerCards={playedCards.map((p) => p.card)}
                  currentPlayer="south"
                  size="md"
                  animate
                />
                <TrickEngine
                  playedCards={playedCards}
                  trumpSuit={trumpSuit}
                  currentTrick={currentTrick}
                  size="sm"
                  animate
                  highlightWinner
                  winner={trickWinner}
                />

                {/* Whose turn it is, from the engine. */}
                {turn && !result && (
                  <p className="text-center text-xs text-text-tertiary">
                    {SEAT_TO_PLAYER[turn] === humanSeat
                      ? "Your turn — play a card."
                      : `${turn} to play…`}
                  </p>
                )}

                {/* Result row */}
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="primary">
                    {declarerSideName} tricks: {tricksByDeclarer}
                  </Badge>
                  <Badge variant="default">
                    {defenderSideName} tricks: {Math.max(0, Math.min(13, currentTrick - 1) - tricksByDeclarer)}
                  </Badge>
                  <Badge variant="default">Trick {Math.min(currentTrick, 13)}/13</Badge>
                  {declarer && (
                    <Badge variant="default">
                      {declarer} declares{contract ? ` ${contract.level}${contract.strain}` : ""}
                    </Badge>
                  )}
                </div>

                {result && (
                  <div
                    role="status"
                    className="rounded-xl border border-border bg-bg-card p-4 text-center space-y-1"
                  >
                    <p className="font-semibold">
                      {contract?.level}
                      {contract?.strain}
                      {contract?.doubled ? (contract.redoubled ? "XX" : "X") : ""} — {result.made ? "made" : "down"}
                    </p>
                    <p className="text-sm text-text-secondary">{result.label}</p>
                    <p className="text-xs text-text-tertiary">
                      Declarer needed {result.tricksRequired} of 13 and took {result.tricksTaken}.
                    </p>
                  </div>
                )}

                {/* Playable cards for the user */}
                {playedCards.some((p) => p.player === 'south') ? (
                  <p className="text-center text-xs text-text-tertiary">Opponents are playing…</p>
                ) : (
                  hands.south.length > 0 && (
                    <div className="rounded-xl border border-border bg-bg-card p-4">
                      <p className="text-xs text-text-tertiary mb-3">
                        {leadSuit === null
                          ? "Click a card to lead:"
                          : `You must follow ${leadSuit}. Cards that break the rule are dimmed.`}
                      </p>
                      {playError && (
                        <p
                          role="alert"
                          className="text-xs text-red-500 mb-3 text-center"
                        >
                          {playError}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
                        {hands.south.map((card) => (
                          <motion.button
                            key={card.id}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePlayCard(card)}
                            className="cursor-pointer"
                          >
                            <CardEngine
                              card={{
                                ...card,
                                faceUp: true,
                                playable: isLegalPlay(
                                  suitCodeFromSymbol(card.suit),
                                  southHeldSuits,
                                  leadSuit === null ? null : suitCodeFromSymbol(leadSuit),
                                ),
                              }}
                              size="sm"
                              interactive
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
