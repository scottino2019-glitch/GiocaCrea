import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Eye,
  Trophy,
  Upload,
  Image as ImageIcon,
  Hash,
  Sparkles,
  Trash2,
  FolderHeart,
} from 'lucide-react';
import { THEME_IMAGES } from '../data/defaultDecks';
import { CustomPuzzle } from '../types/game';
import { playSound } from '../utils/sound';
import { UploadPuzzleModal } from './UploadPuzzleModal';

interface SlidingPuzzleProps {
  customPuzzles?: CustomPuzzle[];
  onSaveCustomPuzzle?: (puzzle: CustomPuzzle) => void;
  onDeleteCustomPuzzle?: (puzzleId: string) => void;
  onOpenExportHtml?: () => void;
}

export function SlidingPuzzle({
  customPuzzles = [],
  onSaveCustomPuzzle,
  onDeleteCustomPuzzle,
  onOpenExportHtml,
}: SlidingPuzzleProps = {}) {
  const [gridSize, setGridSize] = useState<number>(3); // 3x3 or 4x4
  const [selectedImage, setSelectedImage] = useState<string>(
    customPuzzles[0]?.imageUrl || THEME_IMAGES.safari
  );
  const [isNumberMode, setIsNumberMode] = useState<boolean>(false);
  const [showNumbersOnImage, setShowNumbersOnImage] = useState<boolean>(true);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Board state: array of length gridSize * gridSize
  // Each element is the tile's original index (0 to totalTiles - 1).
  // TotalTiles - 1 is the EMPTY tile.
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const totalTiles = gridSize * gridSize;
  const emptyTileValue = totalTiles - 1;

  // Solvability check for sliding puzzles
  function isSolvable(arr: number[], size: number): boolean {
    let inversions = 0;
    const tilesWithoutEmpty = arr.filter((x) => x !== emptyTileValue);

    for (let i = 0; i < tilesWithoutEmpty.length - 1; i++) {
      for (let j = i + 1; j < tilesWithoutEmpty.length; j++) {
        if (tilesWithoutEmpty[i] > tilesWithoutEmpty[j]) {
          inversions++;
        }
      }
    }

    if (size % 2 === 1) {
      // For odd grid sizes (e.g. 3x3, 5x5), puzzle is solvable if inversions is even
      return inversions % 2 === 0;
    } else {
      // For even grid sizes (e.g. 4x4), find row of blank tile from bottom (1-indexed)
      const emptyIndex = arr.indexOf(emptyTileValue);
      const emptyRowFromBottom = size - Math.floor(emptyIndex / size);
      if (emptyRowFromBottom % 2 === 0) {
        return inversions % 2 === 1;
      } else {
        return inversions % 2 === 0;
      }
    }
  }

  // Shuffle and guarantee solvability
  const shuffleBoard = (size = gridSize) => {
    playSound('shuffle');
    const total = size * size;
    let shuffled: number[] = [];
    let solvable = false;

    // Generate until solvable and not already solved
    while (!solvable) {
      shuffled = Array.from({ length: total }, (_, i) => i).sort(
        () => Math.random() - 0.5
      );
      // Check it's not already solved
      const isAlreadySolved = shuffled.every((val, idx) => val === idx);
      if (!isAlreadySolved && isSolvable(shuffled, size)) {
        solvable = true;
      }
    }

    setBoard(shuffled);
    setMoves(0);
    setSeconds(0);
    setIsRunning(false);
    setIsWon(false);
  };

  useEffect(() => {
    shuffleBoard(gridSize);
  }, [gridSize, selectedImage, isNumberMode]);

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

  // Tile movement logic
  const handleTileClick = (index: number) => {
    if (isWon) return;
    const tileVal = board[index];
    if (tileVal === emptyTileValue) return; // Clicking empty tile does nothing

    const emptyIndex = board.indexOf(emptyTileValue);

    const tileRow = Math.floor(index / gridSize);
    const tileCol = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    // Must be adjacent (horizontal or vertical, distance 1)
    const isAdjacent =
      (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
      (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow);

    if (!isAdjacent) {
      playSound('mismatch');
      return;
    }

    if (!isRunning) {
      setIsRunning(true);
    }

    playSound('slide');

    // Swap tile with empty slot
    const nextBoard = [...board];
    nextBoard[emptyIndex] = tileVal;
    nextBoard[index] = emptyTileValue;
    setBoard(nextBoard);
    setMoves((m) => m + 1);

    // Check victory
    const solved = nextBoard.every((val, idx) => val === idx);
    if (solved) {
      setIsWon(true);
      setIsRunning(false);
      playSound('win');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handlePuzzleSaved = (puzzle: CustomPuzzle) => {
    if (onSaveCustomPuzzle) {
      onSaveCustomPuzzle(puzzle);
    }
    setSelectedImage(puzzle.imageUrl);
    setIsNumberMode(false);
    shuffleBoard(gridSize);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const themes = [
    { id: 'safari', label: 'Savana', img: THEME_IMAGES.safari },
    { id: 'cosmos', label: 'Spazio', img: THEME_IMAGES.cosmos },
    { id: 'ocean', label: 'Oceano', img: THEME_IMAGES.ocean },
    { id: 'castle', label: 'Castello', img: THEME_IMAGES.castle },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top HUD Controls */}
      <div className="w-full max-w-2xl mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Grid size switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Griglia:</span>
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {[3, 4].map((size) => (
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
                  {size}x{size} {size === 3 ? '(8-Puzzle)' : '(15-Puzzle)'}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switcher: Image or Numbers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                setIsNumberMode(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                !isNumberMode
                  ? 'bg-slate-800 border-amber-500/80 text-amber-400'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Immagine</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setIsNumberMode(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isNumberMode
                  ? 'bg-slate-800 border-amber-500/80 text-amber-400'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Solo Numeri</span>
            </button>
          </div>
        </div>

        {/* Image selector row if not number mode */}
        {!isNumberMode && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-semibold">Scegli Immagine del Puzzle:</span>

              {/* Toggle numbers on image */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNumbersOnImage}
                  onChange={(e) => setShowNumbersOnImage(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-800"
                />
                Mostra numeri guida
              </label>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {/* Default themes */}
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    playSound('click');
                    setSelectedImage(t.img);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                    selectedImage === t.img
                      ? 'border-amber-400 bg-amber-500/15 text-white font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={t.img}
                    alt={t.label}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded object-cover"
                  />
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}

              {/* User saved custom puzzles */}
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
                      className="w-5 h-5 rounded object-cover border border-slate-700"
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

              {/* Button to open upload & permanent save modal */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Salva Nuovo Puzzle</span>
              </button>
            </div>
          </div>
        )}

        {/* HUD bottom: Timer, Moves, Peek, Shuffle */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 mr-1.5">Tempo:</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {formatTime(seconds)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 mr-1.5">Mosse:</span>
              <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                {moves}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNumberMode && (
              <button
                onClick={() => setShowPreviewModal(!showPreviewModal)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Vedi Foto</span>
              </button>
            )}

            <button
              onClick={() => shuffleBoard(gridSize)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Mescola</span>
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

      {/* Sliding Puzzle Canvas Box */}
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
          const isEmpty = tileOrigIndex === emptyTileValue;

          if (isEmpty) {
            return (
              <div
                key={`empty-${currentSlotIndex}`}
                className="w-full h-full rounded-xl bg-slate-900/40 border border-dashed border-slate-800/80 flex items-center justify-center text-slate-700"
              >
                <span className="text-xs font-mono opacity-30">Vuoto</span>
              </div>
            );
          }

          // Calculate background coordinates for image tiles
          const origRow = Math.floor(tileOrigIndex / gridSize);
          const origCol = tileOrigIndex % gridSize;
          const bgX = (origCol / (gridSize - 1)) * 100;
          const bgY = (origRow / (gridSize - 1)) * 100;

          return (
            <button
              key={`tile-${tileOrigIndex}`}
              onClick={() => handleTileClick(currentSlotIndex)}
              className="w-full h-full rounded-xl overflow-hidden relative cursor-pointer group shadow-md transition-transform duration-100 hover:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={
                !isNumberMode
                  ? {
                      backgroundImage: `url(${selectedImage})`,
                      backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                      backgroundPosition: `${bgX}% ${bgY}%`,
                    }
                  : undefined
              }
            >
              {isNumberMode ? (
                // Number Tile
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center text-amber-300 font-mono font-bold text-xl sm:text-2xl shadow-inner group-hover:border-amber-500/60">
                  {tileOrigIndex + 1}
                </div>
              ) : (
                // Image Tile with optional number guide badge
                showNumbersOnImage && (
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-slate-950/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-[11px] font-mono font-bold shadow">
                    {tileOrigIndex + 1}
                  </div>
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Preview modal/overlay */}
      {showPreviewModal && !isNumberMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-3">Immagine Originale</h4>
            <img
              src={selectedImage}
              alt="Anteprima"
              referrerPolicy="no-referrer"
              className="w-full aspect-square object-cover rounded-xl border border-slate-700 shadow-md mb-4"
            />
            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Chiudi Anteprima
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

            <h3 className="text-2xl font-bold text-white">Puzzle Risolto! 👏</h3>
            <p className="text-slate-400 text-sm mt-1">
              Hai ricomposto tutti i tasselli nell'ordine perfetto!
            </p>

            <div className="my-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-xs text-slate-400">Tempo</span>
                <p className="text-lg font-bold font-mono text-amber-400">
                  {formatTime(seconds)}
                </p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-400">Mosse</span>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {moves}
                </p>
              </div>
            </div>

            <button
              onClick={() => shuffleBoard(gridSize)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Nuova Partita
            </button>
          </div>
        </div>
      )}

      {/* Upload & Permanent Save Modal */}
      {showUploadModal && (
        <UploadPuzzleModal
          onClose={() => setShowUploadModal(false)}
          onSavePuzzle={handlePuzzleSaved}
        />
      )}
    </div>
  );
}
