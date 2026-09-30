import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowRightLeft,
  Settings,
  Plus,
} from 'lucide-react';
import { Deck, CardItem } from '../types/game';
import { playSound } from '../utils/sound';
import { DynamicIcon } from '../utils/iconMap';
import { CustomizePairsModal } from './CustomizePairsModal';

interface MatchPairsGameProps {
  decks: Deck[];
  currentDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onSaveDeck?: (deck: Deck) => void;
  onOpenExportHtml?: () => void;
}

interface MatchSlotItem {
  id: string; // card id
  label: string;
  subLabel?: string;
  iconName?: string;
  imageUrl?: string;
  secondaryIconName?: string;
  secondaryImageUrl?: string;
  color?: string;
  isMatched: boolean;
}

export function MatchPairsGame({
  decks,
  currentDeckId,
  onSelectDeck,
  onSaveDeck,
  onOpenExportHtml,
}: MatchPairsGameProps) {
  const currentDeck = decks.find((d) => d.id === currentDeckId) || decks[0];

  const [leftItems, setLeftItems] = useState<MatchSlotItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchSlotItem[]>([]);

  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);

  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [chosenPairLimit, setChosenPairLimit] = useState<number | 'all'>(6);

  const maxCards = currentDeck?.cards.length || 0;
  const pairCount =
    chosenPairLimit === 'all'
      ? maxCards
      : Math.min(chosenPairLimit, maxCards || 4);

  const initGame = () => {
    if (!currentDeck || currentDeck.cards.length === 0) return;
    playSound('shuffle');

    // Pick random subset of cards according to pairCount
    const shuffledCards = [...currentDeck.cards]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount);

    // Left column: main visual / label representation
    const left: MatchSlotItem[] = shuffledCards.map((c: CardItem) => ({
      id: c.id,
      label: c.label,
      iconName: c.iconName,
      imageUrl: c.imageUrl,
      color: c.color,
      isMatched: false,
    }));

    // Right column: secondary meaning / translation / photo / label representation
    const right: MatchSlotItem[] = [...shuffledCards]
      .sort(() => Math.random() - 0.5)
      .map((c: CardItem) => ({
        id: c.id,
        label: c.secondaryLabel || c.label,
        subLabel: (c.secondaryLabel && c.secondaryLabel !== c.label) ? undefined : undefined,
        secondaryIconName: c.secondaryIconName,
        secondaryImageUrl: c.secondaryImageUrl,
        color: c.color,
        isMatched: false,
      }));

    setLeftItems(left);
    setRightItems(right);
    setSelectedLeftId(null);
    setSelectedRightId(null);
    setMatchedCount(0);
    setMoves(0);
    setSeconds(0);
    setIsRunning(false);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, [currentDeckId, chosenPairLimit]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isWon) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isWon]);

  // Handle match check
  const checkMatch = (leftId: string, rightId: string) => {
    setMoves((m) => m + 1);

    if (leftId === rightId) {
      // Correct match!
      playSound('match');
      const updatedLeft = leftItems.map((item) =>
        item.id === leftId ? { ...item, isMatched: true } : item
      );
      const updatedRight = rightItems.map((item) =>
        item.id === rightId ? { ...item, isMatched: true } : item
      );

      setLeftItems(updatedLeft);
      setRightItems(updatedRight);
      setSelectedLeftId(null);
      setSelectedRightId(null);

      setMatchedCount((c) => {
        const next = c + 1;
        if (next >= pairCount) {
          setIsWon(true);
          setIsRunning(false);
          playSound('win');
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
          });
        }
        return next;
      });
    } else {
      // Incorrect match
      playSound('mismatch');
      // Briefly show mismatch then reset selection
      setTimeout(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
      }, 700);
    }
  };

  const handleSelectLeft = (id: string) => {
    playSound('flip');
    if (!isRunning) setIsRunning(true);

    if (selectedLeftId === id) {
      setSelectedLeftId(null);
      return;
    }

    setSelectedLeftId(id);

    if (selectedRightId) {
      checkMatch(id, selectedRightId);
    }
  };

  const handleSelectRight = (id: string) => {
    playSound('flip');
    if (!isRunning) setIsRunning(true);

    if (selectedRightId === id) {
      setSelectedRightId(null);
      return;
    }

    setSelectedRightId(id);

    if (selectedLeftId) {
      checkMatch(selectedLeftId, id);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const leftColumnHeader = currentDeck?.leftColumnTitle || 'Elemento Sinistro';
  const rightColumnHeader = currentDeck?.rightColumnTitle || 'Elemento Destro';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top HUD Controls */}
      <div className="w-full max-w-3xl mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Deck selector and customize trigger */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase">Set:</span>
            <div className="relative min-w-[160px] max-w-[240px]">
              <select
                value={currentDeck.id}
                onChange={(e) => onSelectDeck(e.target.value)}
                className="w-full appearance-none bg-slate-800 text-white font-semibold text-xs rounded-xl px-3 py-2 pr-8 border border-slate-700 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer truncate"
              >
                {decks.map((deck, idx) => (
                  <option key={`${deck.id}-${idx}`} value={deck.id}>
                    {deck.title} ({deck.cards.length} coppie)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Customize / Create pairs button */}
            {onSaveDeck && (
              <button
                onClick={() => setShowCustomizeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Personalizza Coppie</span>
              </button>
            )}
          </div>

          {/* Pair count and Game Stats */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Limit selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {[4, 6, 8].filter((n) => n <= maxCards).map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    playSound('click');
                    setChosenPairLimit(count);
                  }}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    chosenPairLimit === count
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
              <button
                onClick={() => {
                  playSound('click');
                  setChosenPairLimit('all');
                }}
                className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  chosenPairLimit === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tutte ({maxCards})
              </button>
            </div>

            <div>
              <span className="text-slate-400 mr-1">Tempo:</span>
              <span className="font-mono text-xs font-bold text-white tabular-nums">
                {formatTime(seconds)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 mr-1">Errori:</span>
              <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                {Math.max(0, moves - matchedCount)}
              </span>
            </div>

            <button
              onClick={initGame}
              title="Rimescola e ricomincia"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {onOpenExportHtml && (
              <button
                onClick={onOpenExportHtml}
                title="Esporta questo gioco di abbinamento in un file HTML autonomo"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Esporta HTML</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 text-center max-w-xl">
        {currentDeck.description ||
          'Tocca un elemento nella colonna sinistra e collegalo al corrispondente nella colonna destra.'}
      </p>

      {/* Two columns layout */}
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {leftColumnHeader}
            </span>
          </div>

          {leftItems.map((item) => {
            const isSelected = selectedLeftId === item.id;
            const isMatched = item.isMatched;

            return (
              <button
                key={`left-${item.id}`}
                disabled={isMatched}
                onClick={() => handleSelectLeft(item.id)}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left cursor-pointer min-h-[64px] ${
                  isMatched
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 opacity-60 cursor-default'
                    : isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white'
                }`}
              >
                {/* Visual if image or icon exists */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                ) : item.iconName ? (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                    <DynamicIcon name={item.iconName} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs sm:text-sm block break-words">
                    {item.label}
                  </span>
                </div>

                {isMatched && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {rightColumnHeader}
            </span>
          </div>

          {rightItems.map((item) => {
            const isSelected = selectedRightId === item.id;
            const isMatched = item.isMatched;

            return (
              <button
                key={`right-${item.id}`}
                disabled={isMatched}
                onClick={() => handleSelectRight(item.id)}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all text-left cursor-pointer min-h-[64px] ${
                  isMatched
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 opacity-60 cursor-default'
                    : isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white'
                }`}
              >
                {/* Secondary Visual if present */}
                {item.secondaryImageUrl ? (
                  <img
                    src={item.secondaryImageUrl}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                ) : item.secondaryIconName ? (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                    <DynamicIcon name={item.secondaryIconName} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0 pr-1">
                  <span className="font-bold text-xs sm:text-sm block break-words">
                    {item.label}
                  </span>
                  {item.subLabel && (
                    <span className="text-[11px] text-slate-400 block truncate">
                      ({item.subLabel})
                    </span>
                  )}
                </div>

                {isMatched && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress pill indicator */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>
          Coppie collegate: <strong className="text-white">{matchedCount}</strong> di {pairCount}
        </span>
      </div>

      {/* Victory modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 mb-4">
              <Trophy className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-bold text-white">Abbinamento Completato! 🎉</h3>
            <p className="text-slate-400 text-sm mt-1">
              Hai collegato con successo tutte le {pairCount} coppie di questo set!
            </p>

            <div className="my-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-xs text-slate-400">Tempo</span>
                <p className="text-lg font-bold font-mono text-amber-400">
                  {formatTime(seconds)}
                </p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-400">Tentativi</span>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {moves}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={initGame}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Gioca di Nuovo
              </button>

              {onSaveDeck && (
                <button
                  onClick={() => {
                    setIsWon(false);
                    setShowCustomizeModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Personalizza o Aggiungi Nuove Coppie
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customize Pairs Modal */}
      {showCustomizeModal && onSaveDeck && (
        <CustomizePairsModal
          decks={decks}
          currentDeckId={currentDeck.id}
          onSaveDeck={onSaveDeck}
          onSelectDeck={onSelectDeck}
          onClose={() => setShowCustomizeModal(false)}
        />
      )}
    </div>
  );
}
