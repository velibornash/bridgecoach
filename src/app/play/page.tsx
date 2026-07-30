"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TableEngine } from "@/components/tableEngine/Table";
import { DealAnimation } from "@/components/dealAnimation/DealAnimation";
import { TrickEngine } from "@/components/trickEngine/TrickEngine";
import { BiddingBox, type Bid } from "@/components/biddingBox/BiddingBox";
import { CardEngine } from "@/components/cardEngine/CardEngine";
import { CardBack, createDeck, shuffleDeck, SUITS, RANKS } from "@/components/cardEngine/CardEngine";
import type { BridgeCard, Suit } from "@/components/cardEngine/types";
import { Badge } from "@/components/ui/Badge";

export default function PlayDemoPage() {
  const [phase, setPhase] = useState<'idle' | 'dealing' | 'bidding' | 'trick'>('idle');
  const [hands, setHands] = useState<{ north: BridgeCard[]; east: BridgeCard[]; south: BridgeCard[]; west: BridgeCard[] }>({
    north: [], east: [], south: [], west: [],
  });
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [trumpSuit] = useState<Suit>('♠');
  const [currentTrick, setCurrentTrick] = useState(1);
  const [playedCards, setPlayedCards] = useState<Array<{ player: string; card: BridgeCard; color: Suit }>>([]);
  const [trickWinner, setTrickWinner] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<BridgeCard | null>(null);
  const [tab, setTab] = useState<'deal' | 'bidding' | 'trick'>('deal');

  const handleDealComplete = useCallback((dealtHands: Record<string, BridgeCard[]>) => {
    setHands(dealtHands as { north: BridgeCard[]; east: BridgeCard[]; south: BridgeCard[]; west: BridgeCard[] });
    setPhase('bidding');
    setTab('bidding');
  }, []);

  const handleBid = useCallback((bid: Bid) => {
    setCurrentBid(bid);
    if (bid.label === 'Pass') {
      // Simulate opponent passing too for demo
      setTimeout(() => {
        setPhase('trick');
        setTab('trick');
      }, 800);
    }
  }, []);

  const handlePlayCard = useCallback((card: BridgeCard) => {
    setSelectedCard(card);
    setPlayedCards(prev => [
      ...prev,
      { player: 'south', card, color: trumpSuit },
    ]);
    setSelectedCard(null);

    if (playedCards.length >= 3) {
      setTrickWinner('south');
      setTimeout(() => {
        setPlayedCards([]);
        setTrickWinner(null);
        setCurrentTrick(prev => prev + 1);
      }, 2500);
    }
  }, [playedCards.length, trumpSuit]);

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
                {/* Show a sample hand */}
                {hands.south.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-xs text-text-tertiary mr-2 self-center">Your hand ({hands.south.length} cards):</span>
                    {shuffleDeck(hands.south).slice(0, 5).map((card) => (
                      <CardEngine key={card.id} card={card} size="sm" interactive={false} />
                    ))}
                    {hands.south.length > 5 && (
                      <span className="text-xs text-text-tertiary self-center">+{hands.south.length - 5} more</span>
                    )}
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

                {/* Playable cards for demo */}
                {hands.south.filter(c => !playedCards.some(p => p.card.id === c.id)).length > 0 && (
                  <div className="rounded-xl border border-border bg-bg-card p-4">
                    <p className="text-xs text-text-tertiary mb-3">Click a card to play (demo):</p>
                    <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
                      {hands.south.filter(c => !playedCards.some(p => p.card.id === c.id)).slice(0, 8).map((card) => (
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
                )}
              </div>
            )}
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
