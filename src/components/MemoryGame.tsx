import { useState, useEffect, useTransition } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Eye,
  Trophy,
  User,
  Users,
  Timer,
  CheckCircle2,
  ChevronDown,
  Plus,
  Edit2,
  HelpCircle,
  Sparkles,
  Layers,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import { Deck, MemoryGameCard } from '../types/game';
import { playSound } from '../utils/sound';
import { DynamicIcon } from '../utils/iconMap';
import { QuickCreateMemoryModal } from './QuickCreateMemoryModal';

interface MemoryGameProps {
  decks: Deck[];
  currentDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onSaveDeck?: (deck: Deck) => void;
  onOpenDeckBuilder: () => void;
  onOpenExportHtml?: () => void;
}

export function MemoryGame({
  decks,
  currentDeckId,
  onSelectDeck,
  onSaveDeck,
  onOpenDeckBuilder,
  onOpenExportHtml,
}: MemoryGameProps) {
  const currentDeck = decks.find((d) => d.id === currentDeckId) || decks[0];

  // Quick Create / Edit Modal State
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [quickModalDeck, setQuickModalDeck] = useState<Deck | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Game configuration
  const [cardCount, setCardCount] = useState<number>(12); // Total cards on board
  const [isTwoPlayers, setIsTwoPlayers] = useState<boolean>(false);

  // Game state
  const [cards, setCards] = useState<MemoryGameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // 2-player state
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);

  const [, startTransition] = useTransition();

  // Allowed card counts based on available cards in deck
  const maxPairs = currentDeck ? currentDeck.cards.length : 6;
  const availableCounts = [6, 12, 16, 20, 24].filter((count) => count / 2 <= maxPairs);
  const activeCount = availableCounts.includes(cardCount) ? cardCount : availableCounts[availableCounts.length - 1] || 6;

  // Initialize or reset board
  const initializeGame = (countToUse = activeCount) => {
    if (!currentDeck || currentDeck.cards.length === 0) return;

    playSound('shuffle');
    const pairCount = countToUse / 2;

    // Pick random subset of cards from deck
    const shuffledDeckCards = [...currentDeck.cards].sort(() => Math.random() - 0.5);
    const chosenCards = shuffledDeckCards.slice(0, pairCount);

    const generatedBoard: MemoryGameCard[] = [];

    chosenCards.forEach((c) => {
      // First card of pair
      generatedBoard.push({
        instanceId: `${c.id}-a-${Math.random()}`,
        cardId: c.id,
        type: 'primary',
        label: c.label,
        iconName: c.iconName,
        imageUrl: c.imageUrl,
        color: c.color,
        isFlipped: false,
        isMatched: false,
      });

      // Second card of pair: if image_to_text, this one highlights text
      const isImageToText = currentDeck.matchMode === 'image_to_text';
      generatedBoard.push({
        instanceId: `${c.id}-b-${Math.random()}`,
        cardId: c.id,
        type: 'secondary',
        label: isImageToText ? (c.secondaryLabel || c.label) : c.label,
        iconName: isImageToText ? undefined : c.iconName,
        imageUrl: isImageToText ? undefined : c.imageUrl,
        color: c.color,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle the final board cards
    const shuffledBoard = generatedBoard.sort(() => Math.random() - 0.5);

    setCards(shuffledBoard);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeSeconds(0);
    setIsTimerRunning(false);
    setIsLocked(false);
    setIsVictory(false);
    setActivePlayer(1);
    setPlayer1Score(0);
    setPlayer2Score(0);
  };

  useEffect(() => {
    initializeGame(cardCount);
  }, [currentDeckId, cardCount]);

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isVictory) {
      interval = setInterval(() => {
        setTimeSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isVictory]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    // Start timer on first move
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    playSound('flip');

    // Flip card
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], isFlipped: true };
    setCards(updatedCards);

    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];

      if (firstCard.cardId === secondCard.cardId) {
        // MATCH!
        setTimeout(() => {
          playSound('match');
          const matchedBoard = updatedCards.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return { ...c, isMatched: true };
            }
            return c;
          });

          setCards(matchedBoard);
          setFlippedCards([]);
          setIsLocked(false);
          setMatchedPairs((p) => {
            const nextP = p + 1;
            const totalPairsNeeded = activeCount / 2;
            if (nextP >= totalPairsNeeded) {
              // Victory!
              setIsTimerRunning(false);
              setIsVictory(true);
              playSound('win');
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            }
            return nextP;
          });

          // In 2-player mode: guessing right gives a bonus turn and 1 point!
          if (isTwoPlayers) {
            if (activePlayer === 1) {
              setPlayer1Score((s) => s + 1);
            } else {
              setPlayer2Score((s) => s + 1);
            }
          }
        }, 400);
      } else {
        // MISMATCH!
        setTimeout(() => {
          playSound('mismatch');
          const closedBoard = updatedCards.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          setCards(closedBoard);
          setFlippedCards([]);
          setIsLocked(false);

          // Change turn in 2-player mode
          if (isTwoPlayers) {
            setActivePlayer((p) => (p === 1 ? 2 : 1));
          }
        }, 900);
      }
    }
  };

  // Peek hint feature (flips cards for 1 second)
  const handlePeek = () => {
    if (isLocked || isVictory) return;
    setIsLocked(true);
    playSound('flip');

    const preview = cards.map((c) => ({ ...c, isFlipped: true }));
    setCards(preview);

    setTimeout(() => {
      const restored = cards.map((c) => ({
        ...c,
        isFlipped: c.isMatched,
      }));
      setCards(restored);
      setFlippedCards([]);
      setIsLocked(false);
      setMoves((m) => m + 2); // Small 2-move penalty for peeking
    }, 1200);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const totalPairs = activeCount / 2;

  // Grid columns class based on card count
  const getGridColsClass = () => {
    if (activeCount <= 6) return 'grid-cols-3 max-w-md';
    if (activeCount <= 12) return 'grid-cols-3 sm:grid-cols-4 max-w-xl';
    if (activeCount <= 16) return 'grid-cols-4 max-w-2xl';
    if (activeCount <= 20) return 'grid-cols-4 sm:grid-cols-5 max-w-3xl';
    return 'grid-cols-4 sm:grid-cols-6 max-w-4xl';
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Creation & Customization Hero Header */}
      <div className="w-full max-w-4xl mb-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {currentDeck.title}
              </span>
              {!currentDeck.isBuiltIn && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                  Mazzo Personalizzato
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentDeck.cards.length} elementi · Generano <strong>{currentDeck.cards.length} coppie</strong> ({currentDeck.cards.length * 2} carte totali)
            </p>
          </div>
        </div>

        {/* Big prominent Creation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              playSound('click');
              setQuickModalDeck(null);
              setShowQuickModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crea Nuovo Memory</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setQuickModalDeck(currentDeck);
              setShowQuickModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Modifica Carte</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            title="Come vengono create le card nel Memory?"
            className="flex items-center gap-1 px-3 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer text-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Come Funziona?</span>
          </button>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="w-full max-w-4xl mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Deck selector */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Scegli Mazzo:
            </span>
            <div className="relative w-full md:w-64">
              <select
                value={currentDeck.id}
                onChange={(e) => {
                  startTransition(() => {
                    onSelectDeck(e.target.value);
                  });
                }}
                className="w-full appearance-none bg-slate-800 text-white font-semibold text-xs rounded-xl px-3.5 py-2 pr-9 border border-slate-700 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer truncate"
              >
                {decks.map((deck, idx) => (
                  <option key={`${deck.id}-${idx}`} value={deck.id}>
                    {deck.isBuiltIn ? '🎮' : '⭐'} {deck.title} ({deck.cards.length} coppie)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={onOpenDeckBuilder}
              title="Apri lo studio completo dei mazzi"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
            >
              Studio Mazzi ➔
            </button>
          </div>

          {/* Grid size and Mode selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Cards count */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {availableCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    playSound('click');
                    setCardCount(count);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeCount === count
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count} carte
                </button>
              ))}
            </div>

            {/* Players toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => {
                  playSound('click');
                  setIsTwoPlayers(false);
                  initializeGame();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  !isTwoPlayers
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>1 Giocatore</span>
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setIsTwoPlayers(true);
                  initializeGame();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isTwoPlayers
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2 Giocatori</span>
              </button>
            </div>
          </div>
        </div>

        {/* HUD Info bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {!isTwoPlayers ? (
              <>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Tempo:</span>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">
                    {formatTime(timeSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Mosse:</span>
                  <span className="font-mono text-sm font-bold text-white tabular-nums">
                    {moves}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400">Coppie:</span>
                  <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                    {matchedPairs} / {totalPairs}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${
                    activePlayer === 1
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold ring-1 ring-blue-400'
                      : 'border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <span>Giocatore 1:</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {player1Score} coppie
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${
                    activePlayer === 2
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold ring-1 ring-rose-400'
                      : 'border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <span>Giocatore 2:</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {player2Score} coppie
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons: Peek, Reset and Export HTML */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePeek}
              disabled={isLocked || isVictory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Sbircia (1s)</span>
            </button>

            <button
              onClick={() => initializeGame()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Ricomincia</span>
            </button>

            {onOpenExportHtml && (
              <button
                onClick={onOpenExportHtml}
                title="Esporta questo Memory in un file HTML autonomo"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Esporta HTML</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className={`w-full grid gap-3 sm:gap-4 mx-auto ${getGridColsClass()}`}>
        {cards.map((card, idx) => {
          const isFlipped = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.instanceId}
              onClick={() => handleCardClick(idx)}
              className="aspect-[3/4] cursor-pointer perspective-1000 select-none group"
              role="button"
              tabIndex={0}
              aria-label={`Carta ${idx + 1}`}
            >
              <div
                className={`relative w-full h-full duration-300 transform-style-3d transition-transform ${
                  isFlipped ? 'rotate-y-180' : 'group-hover:scale-[1.02]'
                }`}
              >
                {/* BACK OF CARD (Hidden state) */}
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 p-2 flex flex-col items-center justify-center text-center shadow-lg backface-hidden group-hover:border-amber-500/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400/80 group-hover:text-amber-400 group-hover:scale-110 transition-all">
                    <span className="font-mono text-lg font-black">?</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider mt-2 uppercase">
                    Memory
                  </span>
                </div>

                {/* FRONT OF CARD (Revealed state) */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-2xl border-2 p-2 sm:p-3 flex flex-col items-center justify-between text-center rotate-y-180 backface-hidden shadow-xl transition-all ${
                    card.isMatched
                      ? 'bg-slate-800/90 border-emerald-500/80 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800 border-amber-500/70'
                  }`}
                >
                  {/* Subtle top indicator */}
                  <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span className="opacity-60">{card.type === 'secondary' ? 'B' : 'A'}</span>
                    {card.isMatched && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>

                  {/* Main Visual or Text */}
                  <div className="my-auto flex flex-col items-center justify-center gap-1.5 w-full">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.label}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-slate-700 shadow-md"
                      />
                    ) : card.iconName ? (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-amber-400 shadow-inner">
                        <DynamicIcon name={card.iconName} className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                    ) : null}

                    {/* Label */}
                    <span className="text-xs sm:text-sm font-bold text-white leading-tight px-1 line-clamp-2">
                      {card.label}
                    </span>
                  </div>

                  {/* Tiny footer brand mark */}
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                    {currentDeck.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Victory Modal */}
      {isVictory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 mb-4">
              <Trophy className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-bold text-white">Fantastico! Hai Vinto!</h3>
            <p className="text-slate-400 text-sm mt-1">
              Hai trovato tutte le {totalPairs} coppie con grande memoria e concentrazione.
            </p>

            <div className="my-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-4">
              {!isTwoPlayers ? (
                <>
                  <div className="text-center">
                    <span className="text-xs text-slate-400">Tempo Impiegato</span>
                    <p className="text-lg font-bold font-mono text-amber-400">
                      {formatTime(timeSeconds)}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400">Mosse Totali</span>
                    <p className="text-lg font-bold font-mono text-emerald-400">
                      {moves}
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center">
                  <span className="text-xs text-slate-400">Esito Sfida</span>
                  <p className="text-lg font-bold text-amber-400">
                    {player1Score > player2Score
                      ? 'Vince Giocatore 1! 🏆'
                      : player2Score > player1Score
                      ? 'Vince Giocatore 2! 🏆'
                      : 'Pareggio spettacolare! 🤝'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    G1: {player1Score} · G2: {player2Score} coppie
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => initializeGame()}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Gioca di Nuovo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create / Edit Memory Modal */}
      {showQuickModal && onSaveDeck && (
        <QuickCreateMemoryModal
          initialDeck={quickModalDeck}
          onSaveDeck={onSaveDeck}
          onSelectDeck={(deckId) => {
            onSelectDeck(deckId);
            startTransition(() => {
              initializeGame();
            });
          }}
          onClose={() => setShowQuickModal(false)}
        />
      )}

      {/* "Come Funziona il Memory" Explanatory Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Come vengono create le card nel Memory?
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <span className="font-bold text-amber-300 block text-sm mb-1">
                  💡 La Regola Base:
                </span>
                Ogni elemento che inserisci (una foto o un'icona) genera automaticamente <strong>UNA COPPIA (2 carte)</strong> nel gioco.
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-[11px]">
                    1
                  </span>
                  <div>
                    <strong className="text-white block">Scegli le tue Immagini o Foto:</strong>
                    Puoi caricare qualsiasi foto dal tuo smartphone o computer (foto di famiglia, animali, disegni dei bambini, oggetti di casa) oppure scegliere icone colorate.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <strong className="text-white block">Scegli come abbinare le 2 carte:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-400">
                      <li><strong>Classico:</strong> Le due carte hanno la stessa foto identica.</li>
                      <li><strong>Educativo (Foto ↔ Parola):</strong> Una carta mostra la foto/icona, mentre la sua coppia mostra il nome scritto (ottimo per imparare l'inglese, leggere o associazioni logiche).</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <strong className="text-white block">Durante la Partita:</strong>
                    Tutte le carte vengono coperte e rimescolate. Il giocatore gira 2 carte alla volta: se trova la coppia corretta, le carte rimangono scoperte!
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Tutto Chiaro, Andiamo a Giocare!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
