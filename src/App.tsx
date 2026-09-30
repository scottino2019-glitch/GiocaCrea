/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ActiveGameTab, Deck, CustomPuzzle } from './types/game';
import {
  loadAllDecks,
  saveDeck as persistDeck,
  deleteDeck as removeDeck,
  loadAllCustomPuzzles,
  saveCustomPuzzle as persistCustomPuzzle,
  deleteCustomPuzzle as removeCustomPuzzle,
} from './utils/storage';
import { getSoundMuted, setSoundMuted, playSound } from './utils/sound';
import { Header } from './components/Header';
import { MemoryGame } from './components/MemoryGame';
import { SlidingPuzzle } from './components/SlidingPuzzle';
import { TileSwapPuzzle } from './components/TileSwapPuzzle';
import { MatchPairsGame } from './components/MatchPairsGame';
import { DeckBuilder } from './components/DeckBuilder';
import { ExportHtmlModal } from './components/ExportHtmlModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveGameTab>('memory');
  const [decks, setDecks] = useState<Deck[]>(() => loadAllDecks());
  const [customPuzzles, setCustomPuzzles] = useState<CustomPuzzle[]>(() =>
    loadAllCustomPuzzles()
  );
  const [currentDeckId, setCurrentDeckId] = useState<string>(() => decks[0]?.id || 'deck-safari');
  const [isMuted, setIsMuted] = useState<boolean>(() => getSoundMuted());
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportDeckId, setExportDeckId] = useState<string | undefined>(undefined);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      playSound('click');
    }
  };

  const handleSaveDeck = (deck: Deck) => {
    const updated = persistDeck(deck);
    setDecks(updated);
  };

  const handleDeleteDeck = (deckId: string) => {
    const updated = removeDeck(deckId);
    setDecks(updated);
    if (currentDeckId === deckId && updated.length > 0) {
      setCurrentDeckId(updated[0].id);
    }
  };

  const handleSaveCustomPuzzle = (puzzle: CustomPuzzle) => {
    const updated = persistCustomPuzzle(puzzle);
    setCustomPuzzles(updated);
  };

  const handleDeleteCustomPuzzle = (puzzleId: string) => {
    const updated = removeCustomPuzzle(puzzleId);
    setCustomPuzzles(updated);
  };

  const handlePlayDeck = (deckId: string) => {
    setCurrentDeckId(deckId);
    setActiveTab('memory');
    playSound('flip');
  };

  const handleOpenExportForDeck = (deckId?: string) => {
    setExportDeckId(deckId || currentDeckId);
    setShowExportModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenExportHtml={() => handleOpenExportForDeck()}
      />

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col items-center">
        {activeTab === 'memory' && (
          <MemoryGame
            decks={decks}
            currentDeckId={currentDeckId}
            onSelectDeck={setCurrentDeckId}
            onOpenDeckBuilder={() => setActiveTab('deck_builder')}
            onOpenExportHtml={() => handleOpenExportForDeck()}
          />
        )}

        {activeTab === 'sliding_puzzle' && (
          <SlidingPuzzle
            customPuzzles={customPuzzles}
            onSaveCustomPuzzle={handleSaveCustomPuzzle}
            onDeleteCustomPuzzle={handleDeleteCustomPuzzle}
            onOpenExportHtml={() => handleOpenExportForDeck()}
          />
        )}

        {activeTab === 'tile_puzzle' && (
          <TileSwapPuzzle
            customPuzzles={customPuzzles}
            onSaveCustomPuzzle={handleSaveCustomPuzzle}
            onDeleteCustomPuzzle={handleDeleteCustomPuzzle}
            onOpenExportHtml={() => handleOpenExportForDeck()}
          />
        )}

        {activeTab === 'match_pairs' && (
          <MatchPairsGame
            decks={decks}
            currentDeckId={currentDeckId}
            onSelectDeck={setCurrentDeckId}
            onSaveDeck={handleSaveDeck}
            onOpenExportHtml={() => handleOpenExportForDeck()}
          />
        )}

        {activeTab === 'deck_builder' && (
          <DeckBuilder
            decks={decks}
            onSaveDeck={handleSaveDeck}
            onDeleteDeck={handleDeleteDeck}
            onPlayDeck={handlePlayDeck}
            onOpenExportDeck={handleOpenExportForDeck}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            GiocaCrea · Studio di Memory e Puzzle personalizzati con esportazione HTML
          </p>
          <p className="text-[11px] text-slate-500">
            Funziona 100% offline nel browser · Scarica giochi in formato HTML autonomo
          </p>
        </div>
      </footer>

      {/* Standalone HTML Export Modal */}
      {showExportModal && (
        <ExportHtmlModal
          decks={decks}
          customPuzzles={customPuzzles}
          initialDeckId={exportDeckId}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
