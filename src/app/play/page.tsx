"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

type Player = 'north' | 'east' | 'south' | 'west';

export default function PlayDemoPage() {
  const [phase, setPhase] = useState<'idle' | 'dealing' | 'bidding' | 'trick'>('idle');
  const [hands, setHands] = useState<Record<Player, BridgeCard[]>>({
    north: [], east: [], south: [], west: [],
  });
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [trumpSuit] = useState<Suit>('♠');
  const [currentTrick, setCurrentTrick] = useState(1);
  const [playedCards, setPlayedCards] = useState<Array<{ player: Player; card: BridgeCard; color: Suit }>>([]);
  const [trickWinner, setTrickWinner] = useState<string | null>(null);
  const [tricksByDeclarer, setTricksByDeclarer] = useState(0);
  const [tab, setTab] = useState<'deal' | 'bidding' | 'trick'>('deal');
  const handsRef = useRef(hands);

  useEffect(() => {
    handsRef.current = hands;
  }, [hands]);

  const handleDealComplete = useCallback((dealtHands: Record<string, BridgeCard[]>) => {
    setHands(dealtHands as Record<Player, BridgeCard[]>);
    setPhase('bidding');
    setTab('bidding');
  }, []);

  const handleBid = useCallback((bid: Bid) => {
    setCurrentBid(bid);
    if (bid.label !== 'Pass') {
      // Simulate opponents passing around the table, then start play
      setTimeout(() => {
        setPhase('trick');
        setTab('trick');
      }, 900);
    }
  }, []);

  const playCardFor = (player: Player, card: BridgeCard) => {
    setPlayedCards((prev) => [...prev, { player, card, color: trumpSuit }]);
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
      setPlayedCards((prev) => [...prev, { player, card, color: trumpSuit }]);
      setHands((prev) => ({
        ...prev,
        [player]: prev[player].filter((c) => c.id !== card.id),
      }));
    }, 600);
  }, [trumpSuit]);

  const handlePlayCard = useCallback((card: BridgeCard) => {
    if (playedCards.some((p) => p.player === 'south')) return;
    playCardFor('south', card);

    // Determine lead suit from the first played card
    const leadSuit = card.suit;

    // Auto-play west, north, east in turn
    autoPlayOpponent('west', leadSuit);
    setTimeout(() => autoPlayOpponent('north', leadSuit), 650);
    setTimeout(() => autoPlayOpponent('east', leadSuit), 1300);
  }, [playedCards, autoPlayOpponent]);

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
        setCurrentTrick((t) => (t >= 13 ? 13 : t + 1));
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
