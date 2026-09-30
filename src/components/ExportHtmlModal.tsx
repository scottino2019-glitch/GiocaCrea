import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Code,
  Sparkles,
  Eye,
  CheckCircle2,
  FileCode,
  Layers,
  Puzzle,
  Gamepad2,
} from 'lucide-react';
import { Deck, CustomPuzzle } from '../types/game';
import { THEME_IMAGES } from '../data/defaultDecks';
import {
  ExportGameType,
  generateStandaloneHtml,
  downloadStandaloneHtmlFile,
  bundleDeckWithBase64,
} from '../utils/exportHtml';
import { playSound } from '../utils/sound';

interface ExportHtmlModalProps {
  decks: Deck[];
  customPuzzles?: CustomPuzzle[];
  initialDeckId?: string;
  onClose: () => void;
}

export function ExportHtmlModal({
  decks,
  customPuzzles = [],
  initialDeckId,
  onClose,
}: ExportHtmlModalProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    initialDeckId || (decks[0]?.id ?? '')
  );
  const [selectedGameType, setSelectedGameType] = useState<ExportGameType>('all');
  const [selectedPuzzleImg, setSelectedPuzzleImg] = useState<string>(
    THEME_IMAGES.safari
  );
  const [isBundling, setIsBundling] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [activeView, setActiveView] = useState<'preview' | 'info'>('preview');

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  // Generate live preview whenever choices change
  useEffect(() => {
    if (!selectedDeck) return;
    const html = generateStandaloneHtml(selectedDeck, selectedPuzzleImg, selectedGameType);
    setPreviewHtml(html);
  }, [selectedDeck, selectedPuzzleImg, selectedGameType]);

  const handleDownload = async () => {
    if (!selectedDeck) return;
    playSound('click');
    setIsBundling(true);

    try {
      // Convert any local image URLs to Base64 so the HTML file is 100% portable
      const bundledDeck = await bundleDeckWithBase64(selectedDeck);
      downloadStandaloneHtmlFile(bundledDeck, selectedPuzzleImg, selectedGameType);
      playSound('win');
    } catch (err) {
      console.error('Export error', err);
      // Fallback
      downloadStandaloneHtmlFile(selectedDeck, selectedPuzzleImg, selectedGameType);
    } finally {
      setIsBundling(false);
    }
  };

  if (!selectedDeck) return null;

  const gameTypeOptions: { id: ExportGameType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      label: 'Pacchetto Completo (Tutti i Giochi)',
      desc: 'Include Memory, Puzzle Scivolo, Puzzle Tessere e Collega Coppie con barra di navigazione',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'memory',
      label: 'Solo Memory Card Game',
      desc: 'File HTML dedicato esclusivamente al Memory con le tue carte e suoni',
      icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'sliding_puzzle',
      label: 'Solo Puzzle Scivolo (15-Puzzle)',
      desc: 'File HTML dedicato con griglia a scorrimento tasselli e timer',
      icon: <Puzzle className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'tile_puzzle',
      label: 'Solo Puzzle Tessere (Swap)',
      desc: 'File HTML per ricomporre l\'immagine scambiando le tessere',
      icon: <Puzzle className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'match_pairs',
      label: 'Solo Collega le Coppie',
      desc: 'File HTML con le due colonne interattive di abbinamento',
      icon: <CheckCircle2 className="w-4 h-4 text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Esporta Gioco in File HTML Autonomo
              </h2>
              <p className="text-xs text-slate-400">
                Un singolo file .html autosufficiente: funziona ovunque, senza server e senza connessione.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Row */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Deck Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300">Mazzo:</label>
              <select
                value={selectedDeck.id}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                {decks.map((deck, idx) => (
                  <option key={`${deck.id}-${idx}`} value={deck.id}>
                    {deck.title} ({deck.cards.length} carte)
                  </option>
                ))}
              </select>
            </div>

            {/* Game Type Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300">Formato:</label>
              <select
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value as ExportGameType)}
                className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                {gameTypeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Puzzle Image Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300">Foto Puzzle:</label>
              <select
                value={selectedPuzzleImg}
                onChange={(e) => setSelectedPuzzleImg(e.target.value)}
                className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-400 max-w-[180px] truncate"
              >
                <optgroup label="Temi Base">
                  <option value={THEME_IMAGES.safari}>Savana Animale</option>
                  <option value={THEME_IMAGES.cosmos}>Cosmo & Spazio</option>
                  <option value={THEME_IMAGES.ocean}>Mondo Marino</option>
                  <option value={THEME_IMAGES.castle}>Castello Incantato</option>
                  {selectedDeck.coverImage && (
                    <option value={selectedDeck.coverImage}>Copertina del Mazzo</option>
                  )}
                </optgroup>

                {customPuzzles.length > 0 && (
                  <optgroup label="I Miei Puzzle Salvati">
                    {customPuzzles.map((cp) => (
                      <option key={cp.id} value={cp.imageUrl}>
                        ⭐ {cp.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Download Action Button */}
          <button
            onClick={handleDownload}
            disabled={isBundling}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isBundling ? 'Generazione in corso...' : 'Scarica File .HTML Autonomo'}</span>
          </button>
        </div>

        {/* View Switcher: Live Interactive Preview vs Info */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === 'preview'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Anteprima Live Interattiva</span>
            </button>
            <button
              onClick={() => setActiveView('info')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === 'info'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Come usarlo & Vantaggi</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Tutto in 1 solo file .html · Nessun server necessario
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4 bg-slate-950">
          {activeView === 'preview' ? (
            <div className="w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-inner relative flex flex-col">
              <iframe
                title="Anteprima Gioco Autonomo"
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                className="w-full flex-1 border-0"
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-6 space-y-5 text-sm text-slate-300">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Cos'è un File HTML Autonomo?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  È un file <code className="text-amber-400 font-mono">.html</code> che racchiude al suo interno l'intera applicazione di gioco: struttura, grafica CSS, immagini, codice JavaScript di logica e persino il motore di sintesi audio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <h5 className="font-bold text-white mb-1">💻 Come si apre</h5>
                  <p className="text-slate-400">
                    Fai doppio click sul file sul tuo PC (Windows, Mac, Linux) o tocca sul telefono: si apre all'istante nel browser predefinito.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <h5 className="font-bold text-white mb-1">✈️ 100% Offline</h5>
                  <p className="text-slate-400">
                    Funziona anche in aereo o senza connessione Wi-Fi, perché non scarica nulla da server esterni.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <h5 className="font-bold text-white mb-1">✉️ Condivisione Immediata</h5>
                  <p className="text-slate-400">
                    Invialo come allegato su WhatsApp, Telegram o via email a colleghi, alunni o familiari.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <h5 className="font-bold text-white mb-1">🌐 Pubblicabile Ovunque</h5>
                  <p className="text-slate-400">
                    Puoi caricarlo su Google Drive, Dropbox, un sito web o su una chiavetta USB come gioco portatile.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
