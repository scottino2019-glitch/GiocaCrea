import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Eye,
  Trophy,
  Upload,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { THEME_IMAGES } from '../data/defaultDecks';
import { CustomPuzzle } from '../types/game';
import { playSound } from '../utils/sound';
import { UploadPuzzleModal } from './UploadPuzzleModal';

interface TileSwapPuzzleProps {
  customPuzzles?: CustomPuzzle[];
  onSaveCustomPuzzle?: (puzzle: CustomPuzzle) => void;
  onDeleteCustomPuzzle?: (puzzleId: string) => void;
  onOpenExportHtml?: () => void;
}

export function TileSwapPuzzle({
  customPuzzles = [],
  onSaveCustomPuzzle,
  onDeleteCustomPuzzle,
  onOpenExportHtml,
}: TileSwapPuzzleProps = {}) {
  const [gridSize, setGridSize] = useState<number>(3); // 3x3 or 4x4
  const [selectedImage, setSelectedImage] = useState<string>(
    customPuzzles[0]?.imageUrl || THEME_IMAGES.ocean
  );
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Array of tiles: index is current slot, value is original tile index
  const [board, setBoard] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const totalTiles = gridSize * gridSize;

  // Shuffle board so not all tiles are already correct
  const shuffleBoard = (size = gridSize) => {
    playSound('shuffle');
    const total = size * size;
    let shuffled: number[] = [];
    let correctCount = total;

    // Ensure it's not solved initially
    while (correctCount > 1) {
      shuffled = Array.from({ length: total }, (_, i) => i).sort(
        () => Math.random() - 0.5
      );
      correctCount = shuffled.filter((val, idx) => val === idx).length;
    }

    setBoard(shuffled);
    setSelectedSlot(null);
    setMoves(0);
    setSeconds(0);
    setIsRunning(false);
    setIsWon(false);
  };

  useEffect(() => {
    shuffleBoard(gridSize);
  }, [gridSize, selectedImage]);

  // Timer loop
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

  // Handle tile swap click
  const handleSlotClick = (slotIndex: number) => {
    if (isWon) return;

    if (!isRunning) {
      setIsRunning(true);
    }

    if (selectedSlot === null) {
      // First tile selected
      playSound('click');
      setSelectedSlot(slotIndex);
    } else if (selectedSlot === slotIndex) {
      // Deselect
      playSound('click');
      setSelectedSlot(null);
    } else {
      // Swap tiles!
      playSound('slide');
      const nextBoard = [...board];
      const temp = nextBoard[selectedSlot];
      nextBoard[selectedSlot] = nextBoard[slotIndex];
      nextBoard[slotIndex] = temp;

      setBoard(nextBoard);
      setSelectedSlot(null);
      setMoves((m) => m + 1);

      // Check if newly placed piece is in correct spot
      if (
        nextBoard[slotIndex] === slotIndex ||
        nextBoard[selectedSlot] === selectedSlot
      ) {
        playSound('match');
      }

      // Check win
      const allCorrect = nextBoard.every((val, idx) => val === idx);
      if (allCorrect) {
        setIsWon(true);
        setIsRunning(false);
        playSound('win');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handlePuzzleSaved = (puzzle: CustomPuzzle) => {
    if (onSaveCustomPuzzle) {
      onSaveCustomPuzzle(puzzle);
    }
    setSelectedImage(puzzle.imageUrl);
    shuffleBoard(gridSize);
  };

  const correctPieces = board.filter((val, idx) => val === idx).length;
  const progressPercent = Math.round((correctPieces / totalTiles) * 100);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const themes = [
    { id: 'ocean', label: 'Oceano', img: THEME_IMAGES.ocean },
    { id: 'castle', label: 'Castello', img: THEME_IMAGES.castle },
    { id: 'safari', label: 'Savana', img: THEME_IMAGES.safari },
    { id: 'cosmos', label: 'Spazio', img: THEME_IMAGES.cosmos },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top HUD Controls */}
      <div className="w-full max-w-2xl mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Grid size */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Tessere:</span>
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {[3, 4, 5].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    playSound('click');
                    setGridSize(size);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    gridSize === size
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {size}x{size} ({size * size} pz)
                </button>
              ))}
            </div>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  playSound('click');
                  setSelectedImage(t.img);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  selectedImage === t.img
                    ? 'border-amber-400 bg-amber-500/15 text-white font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <img
                  src={t.img}
                  alt={t.label}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded object-cover"
                />
                <span className="text-xs">{t.label}</span>
              </button>
            ))}

            {/* Saved custom puzzles */}
            {customPuzzles.map((cp, idx) => (
              <div
                key={`${cp.id}-${idx}`}
                className={`flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg border transition-all shrink-0 ${
                  selectedImage === cp.imageUrl
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedImage(cp.imageUrl);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <img
                    src={cp.imageUrl}
                    alt={cp.title}
                    className="w-4 h-4 rounded object-cover border border-slate-700"
                  />
                  <span className="text-xs max-w-[90px] truncate">{cp.title}</span>
                </button>
                {onDeleteCustomPuzzle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Eliminare il puzzle "${cp.title}"?`)) {
                        onDeleteCustomPuzzle(cp.id);
                        if (selectedImage === cp.imageUrl) {
                          setSelectedImage(themes[0].img);
                        }
                      }
                    }}
                    title="Elimina puzzle salvato"
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Salva Nuovo Puzzle</span>
            </button>
          </div>
        </div>

        {/* HUD bottom stats */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-5">
            <div>
              <span className="text-slate-400 mr-1.5">Tempo:</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {formatTime(seconds)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 mr-1.5">Scambi:</span>
              <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                {moves}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Completato:</span>
              <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {correctPieces}/{totalTiles} ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreviewModal(!showPreviewModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Modello</span>
            </button>

            <button
              onClick={() => shuffleBoard(gridSize)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Rimescola</span>
            </button>

            {onOpenExportHtml && (
              <button
                onClick={onOpenExportHtml}
                title="Esporta questo puzzle come file HTML autonomo"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Esporta HTML</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions pill */}
      <p className="text-xs text-slate-400 mb-3 text-center">
        Clicca su una prima tessera per selezionarla, poi clicca su una seconda per scambiarle!
      </p>

      {/* Tile Puzzle Grid */}
      <div
        className="w-full max-w-md sm:max-w-lg aspect-square bg-slate-950 p-2 sm:p-3 rounded-2xl border-2 border-slate-800 shadow-2xl relative select-none"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          gap: '6px',
        }}
      >
        {board.map((tileOrigIndex, currentSlotIndex) => {
          const isSelected = selectedSlot === currentSlotIndex;
          const isCorrect = tileOrigIndex === currentSlotIndex;

          const origRow = Math.floor(tileOrigIndex / gridSize);
          const origCol = tileOrigIndex % gridSize;
          const bgX = (origCol / (gridSize - 1)) * 100;
          const bgY = (origRow / (gridSize - 1)) * 100;

          return (
            <button
              key={`tile-${currentSlotIndex}`}
              onClick={() => handleSlotClick(currentSlotIndex)}
              className={`w-full h-full rounded-xl overflow-hidden relative cursor-pointer group shadow transition-all duration-150 focus:outline-none ${
                isSelected
                  ? 'ring-4 ring-amber-400 scale-[1.04] z-10'
                  : isCorrect
                  ? 'border border-emerald-500/60'
                  : 'border border-slate-800 hover:border-slate-600'
              }`}
              style={{
                backgroundImage: `url(${selectedImage})`,
                backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                backgroundPosition: `${bgX}% ${bgY}%`,
              }}
            >
              {/* Subtle indicator if correct */}
              {isCorrect && (
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500/80 backdrop-blur-sm flex items-center justify-center text-white">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              )}

              {/* Selection overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="text-xs font-bold text-white bg-slate-950/70 px-2 py-0.5 rounded-full font-mono">
                    Scambia
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Preview modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-3">Immagine Completa da Ricomporre</h4>
            <img
              src={selectedImage}
              alt="Modello"
              referrerPolicy="no-referrer"
              className="w-full aspect-square object-cover rounded-xl border border-slate-700 shadow-md mb-4"
            />
            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Torna al Gioco
            </button>
          </div>
        </div>
      )}

      {/* Victory modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 mb-4">
              <Trophy className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-bold text-white">Quadro Ricomposto! 🎉</h3>
            <p className="text-slate-400 text-sm mt-1">
              Hai posizionato tutte le {totalTiles} tessere perfettamente al loro posto!
            </p>

            <div className="my-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-xs text-slate-400">Tempo</span>
                <p className="text-lg font-bold font-mono text-amber-400">
                  {formatTime(seconds)}
                </p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-400">Scambi Totali</span>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {moves}
                </p>
              </div>
            </div>

            <button
              onClick={() => shuffleBoard(gridSize)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Rigioca Puzzle
            </button>
          </div>
        </div>
      )}

      {/* Upload and Permanent Save Modal */}
      {showUploadModal && (
        <UploadPuzzleModal
          onClose={() => setShowUploadModal(false)}
          onSavePuzzle={handlePuzzleSaved}
        />
      )}
    </div>
  );
}
