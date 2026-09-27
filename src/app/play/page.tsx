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
import { AuctionStateMachine, formatBid } from "@/bridge";
import { trumpSuitOf } from "@/bridge/contract";
import { getSuitPresentation, suitCodeFromSymbol } from "@/bridge/suits";
import type { BidCall, Contract, Strain } from "@/bridge/types";

type Player = 'north' | 'east' | 'south' | 'west';

/**
 * The bidding box names suits as symbols ("♠"), the engine as codes ("S").
 * Notrump is already a code in both.
 */
function toStrain(suit: string): Strain {
  return suit === "NT" ? "NT" : suitCodeFromSymbol(suit);
}

export default function PlayDemoPage() {
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
  const [currentTrick, setCurrentTrick] = useState(1);
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

  const handleDealComplete = useCallback(async (dealtHands: Record<string, BridgeCard[]>) => {
    setHands(dealtHands as Record<Player, BridgeCard[]>);
    setPhase('bidding');
    setTab('bidding');
    bidCalls.current = [];
    cardCalls.current = [];

    // Store the deal. Engine notation is what the schema documents ("SA").
    const notation = (cards: BridgeCard[]) =>
      Object.fromEntries(cards.map((c) => [c.id, `${c.suit}${c.rank}`]));
    const result = await createHand({
      dealer: "S",
      north: notation((dealtHands as Record<string, BridgeCard[]>).north ?? []),
      east: notation((dealtHands as Record<string, BridgeCard[]>).east ?? []),
      south: notation((dealtHands as Record<string, BridgeCard[]>).south ?? []),
      west: notation((dealtHands as Record<string, BridgeCard[]>).west ?? []),
    });
    handId.current = result.data?.id ?? null;
  }, []);

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
    bidCalls.current.push({ player: "S", bid: formatBid(call) });

    // Feed the same call to the engine and let it work out the contract, rather
    // than tracking the strain here as well.
    const machine = auctionRef.current ?? new AuctionStateMachine({ dealer: "S" });
    auctionRef.current = machine;
    machine.submit(call);

    if (!isPass) {
      // The other three seats pass, so the auction ends here and the contract is
      // real. These passes are simulation, not user input, and are deliberately
      // not added to `bidCalls` - only calls the user made are recorded as their
      // actions.
      for (let i = 0; i < 3; i += 1) machine.submit("P");
      setContract(machine.finalContract()?.contract ?? null);

      // Simulate opponents passing around the table, then start play
      setTimeout(() => {
        setPhase('trick');
        setTab('trick');
      }, 900);
    }
  }, []);

  const playCardFor = (player: Player, card: BridgeCard) => {
    setPlayedCards((prev) => [...prev, { player, card }]);
    setHands((prev) => ({
      ...prev,
      [player]: prev[player].filter((c) => c.id !== card.id),
    }));
  };

  const autoPlayOpponent = useCallback((player: Player, leadSuit: Suit | null) => {
    setTimeout(() => {
      const hand = handsRef.current[player];
      if (!hand || hand.length === 0) return;
      let card: BridgeCard;
      if (leadSuit) {
        const follow = hand.filter((c) => c.suit === leadSuit);
        card = (follow.length > 0 ? follow : hand)[0];
      } else {
        card = hand[0];
      }
      setPlayedCards((prev) => [...prev, { player, card }]);
      setHands((prev) => ({
        ...prev,
        [player]: prev[player].filter((c) => c.id !== card.id),
      }));
    }, 600);
  }, [trumpSuit]);

  const handlePlayCard = useCallback((card: BridgeCard) => {
    if (playedCards.some((p) => p.player === 'south')) return;
    playCardFor('south', card);

    // Card plays are recorded as practice actions, not auction actions.
    cardCalls.current.push({ phase: "play", player: "S", card: `${card.suit}${card.rank}` });

    // Determine lead suit from the first played card
    const leadSuit = card.suit;

    // Auto-play west, north, east in turn
    autoPlayOpponent('west', leadSuit);
    setTimeout(() => autoPlayOpponent('north', leadSuit), 650);
    setTimeout(() => autoPlayOpponent('east', leadSuit), 1300);
  }, [playedCards, autoPlayOpponent]);

  const recorded = useRef(false);
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
      dealer: "S",
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
  }, []);

  // Resolve the trick once all 4 cards are played
  useEffect(() => {
    if (playedCards.length !== 4) return;
    const timer = setTimeout(() => {
      const winner = getWinner(playedCards, trumpSuit);
      setTrickWinner(winner);
      if (winner === 'south' || winner === 'north') {
        setTricksByDeclarer((t) => t + 1);
      }
      const finishTimer = setTimeout(() => {
        setPlayedCards([]);
        setTrickWinner(null);
        setCurrentTrick((t) => {
          const next = t >= 13 ? 13 : t + 1;
          // Thirteen tricks ends the hand; record it once, then.
          if (next === 13 && handId.current && !recorded.current) {
            recorded.current = true;
            void finishHand();
          }
          return next;
        });
      }, 2200);
      return () => clearTimeout(finishTimer);
    }, 700);
    return () => clearTimeout(timer);
  }, [playedCards, trumpSuit]);

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
              <DealAnimation onComplete={handleDealComplete} size="lg" />
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

                {/* Result row */}
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="primary">NS tricks: {tricksByDeclarer}</Badge>
                  <Badge variant="default">EW tricks: {Math.max(0, currentTrick - 1 - tricksByDeclarer)}</Badge>
                  <Badge variant="default">Trick {currentTrick}/13</Badge>
                </div>

                {/* Playable cards for the user */}
                {playedCards.some((p) => p.player === 'south') ? (
                  <p className="text-center text-xs text-text-tertiary">Opponents are playing…</p>
                ) : (
                  hands.south.length > 0 && (
                    <div className="rounded-xl border border-border bg-bg-card p-4">
                      <p className="text-xs text-text-tertiary mb-3">Click a card to lead:</p>
                      <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
                        {hands.south.map((card) => (
                          <motion.button
                            key={card.id}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePlayCard(card)}
                            className="cursor-pointer"
                          >
                            <CardEngine card={{ ...card, faceUp: true, playable: true }} size="sm" interactive />
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
