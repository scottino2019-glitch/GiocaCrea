import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Copy,
  Sparkles,
  Play,
  Save,
  Check,
  X,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';
import { Deck, CardItem, MatchMode } from '../types/game';
import { ICON_LIBRARY, DynamicIcon, COLOR_PALETTE } from '../utils/iconMap';
import { exportDeckAsJSON, parseDeckJSON } from '../utils/storage';
import { playSound } from '../utils/sound';

interface DeckBuilderProps {
  decks: Deck[];
  onSaveDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onPlayDeck: (deckId: string) => void;
  onOpenExportDeck: (deckId: string) => void;
}

export function DeckBuilder({
  decks,
  onSaveDeck,
  onDeleteDeck,
  onPlayDeck,
  onOpenExportDeck,
}: DeckBuilderProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [isAddingNewCard, setIsAddingNewCard] = useState<boolean>(false);
  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>('Tutti');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  const fileInputImportRef = useRef<HTMLInputElement>(null);
  const cardImageUploadRef = useRef<HTMLInputElement>(null);

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  // Helper to optimize and compress user-uploaded image for localStorage
  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 256x256 max for snappy local storage
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setEditingCard({
            ...editingCard,
            imageUrl: dataUrl,
            iconName: undefined, // Clear icon if image is used
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Create brand new custom deck
  const handleCreateNewDeck = () => {
    playSound('click');
    const newDeck: Deck = {
      id: 'deck-custom-' + Date.now(),
      title: 'Nuovo Mazzo Personalizzato',
      description: 'Mazzo creato da te con le tue carte preferite.',
      matchMode: 'identical',
      category: 'Personalizzato',
      isBuiltIn: false,
      createdAt: Date.now(),
      cards: [
        {
          id: 'card-1',
          label: 'Stella d\'Oro',
          iconName: 'Star',
          color: COLOR_PALETTE[0].value,
        },
        {
          id: 'card-2',
          label: 'Cuore Rosso',
          iconName: 'Heart',
          color: COLOR_PALETTE[4].value,
        },
        {
          id: 'card-3',
          label: 'Quadrifoglio Fortunato',
          iconName: 'Flower2',
          color: COLOR_PALETTE[1].value,
        },
      ],
    };
    onSaveDeck(newDeck);
    setSelectedDeckId(newDeck.id);
  };

  // Duplicate deck
  const handleDuplicateDeck = (deckToCopy: Deck) => {
    playSound('click');
    const copy: Deck = {
      ...deckToCopy,
      id: 'deck-copy-' + Date.now(),
      title: `${deckToCopy.title} (Copia)`,
      isBuiltIn: false,
      createdAt: Date.now(),
    };
    onSaveDeck(copy);
    setSelectedDeckId(copy.id);
  };

  // Import JSON deck
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = parseDeckJSON(content);
        onSaveDeck(imported);
        setSelectedDeckId(imported.id);
        playSound('win');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Errore durante l\'importazione del file JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Update deck metadata (title, description, matchMode)
  const handleUpdateDeckMeta = (
    field: 'title' | 'description' | 'matchMode' | 'category',
    value: string
  ) => {
    if (!activeDeck) return;
    const updated = {
      ...activeDeck,
      [field]: value,
      isBuiltIn: false, // Once edited, it's custom
    };
    onSaveDeck(updated as Deck);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Start adding a new card
  const handleStartAddCard = () => {
    playSound('click');
    setEditingCard({
      id: 'card-' + Date.now(),
      label: 'Nuova Carta',
      secondaryLabel: activeDeck.matchMode === 'image_to_text' ? 'Significato / Traduzione' : '',
      iconName: 'Sparkles',
      color: COLOR_PALETTE[0].value,
    });
    setIsAddingNewCard(true);
  };

  // Save editing card into deck
  const handleSaveCard = () => {
    if (!activeDeck || !editingCard) return;
    playSound('click');

    let updatedCards: CardItem[];
    if (isAddingNewCard) {
      updatedCards = [...activeDeck.cards, editingCard];
    } else {
      updatedCards = activeDeck.cards.map((c) =>
        c.id === editingCard.id ? editingCard : c
      );
    }

    const updatedDeck: Deck = {
      ...activeDeck,
      cards: updatedCards,
      isBuiltIn: false,
    };

    onSaveDeck(updatedDeck);
    setEditingCard(null);
    setIsAddingNewCard(false);
  };

  // Delete card from deck
  const handleDeleteCard = (cardId: string) => {
    if (!activeDeck) return;
    if (activeDeck.cards.length <= 3) {
      alert('Un mazzo deve contenere almeno 3 carte per poter giocare!');
      return;
    }
    playSound('click');
    const updatedDeck: Deck = {
      ...activeDeck,
      cards: activeDeck.cards.filter((c) => c.id !== cardId),
      isBuiltIn: false,
    };
    onSaveDeck(updatedDeck);
  };

  // Filter icon library
  const availableCategories = ['Tutti', 'Natura', 'Avventura', 'Fantasia', 'Cibo', 'Giochi', 'Forme'];
  const filteredIconKeys = Object.keys(ICON_LIBRARY).filter((key) => {
    const entry = ICON_LIBRARY[key];
    const matchCategory =
      iconCategoryFilter === 'Tutti' || entry.category === iconCategoryFilter;
    const matchSearch =
      !searchTerm ||
      entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Deck Management Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            Studio Mazzi Personalizzati
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crea, modifica o duplica i tuoi mazzi con le tue immagini, icone e vocaboli.
          </p>
        </div>

        {/* Global actions: New deck, Import JSON */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputImportRef}
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => fileInputImportRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Importa Mazzo JSON</span>
          </button>

          <button
            onClick={handleCreateNewDeck}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crea Nuovo Mazzo</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Deck List (Left) + Deck Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deck Picker List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            I Tuoi Mazzi ({decks.length})
          </span>

          <div className="flex flex-col gap-2.5 max-h-[700px] overflow-y-auto pr-1">
            {decks.map((deck, idx) => {
              const isSelected = deck.id === activeDeck?.id;
              return (
                <div
                  key={`${deck.id}-${idx}`}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500/40 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white truncate">
                      {deck.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {deck.cards.length} carte
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {deck.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">
                      {deck.matchMode === 'image_to_text' ? 'Figura ↔ Testo' : 'Coppie Identiche'}
                    </span>
                    {deck.isBuiltIn && (
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        Base
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Deck Editor */}
        {activeDeck && (
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Deck Configuration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    Modifica Mazzo
                  </h3>
                  {saveSuccessNotice && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                      <Check className="w-3.5 h-3.5" /> Salvato
                    </span>
                  )}
                </div>

                {/* Deck Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayDeck(activeDeck.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Gioca Subito</span>
                  </button>

                  <button
                    onClick={() => onOpenExportDeck(activeDeck.id)}
                    title="Esporta il mazzo come gioco HTML singolo autosufficiente"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Esporta Gioco HTML</span>
                  </button>

                  <button
                    onClick={() => exportDeckAsJSON(activeDeck)}
                    title="Esporta mazzo in formato JSON"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Esporta JSON</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateDeck(activeDeck)}
                    title="Crea una copia modificabile"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {!activeDeck.isBuiltIn && (
                    <button
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler eliminare il mazzo "${activeDeck.title}"?`)) {
                          onDeleteDeck(activeDeck.id);
                        }
                      }}
                      title="Elimina mazzo"
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/40 rounded-lg border border-slate-700 hover:border-rose-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Titolo del Mazzo
                  </label>
                  <input
                    type="text"
                    value={activeDeck.title}
                    onChange={(e) => handleUpdateDeckMeta('title', e.target.value)}
                    className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Tipo di Abbinamento Coppie
                  </label>
                  <select
                    value={activeDeck.matchMode}
                    onChange={(e) =>
                      handleUpdateDeckMeta('matchMode', e.target.value as MatchMode)
                    }
                    className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="identical">Coppie Identiche (Classico Memory)</option>
                    <option value="image_to_text">
                      Figura ↔ Testo (Educativo / Lingue)
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Descrizione o Istruzioni per chi gioca
                  </label>
                  <input
                    type="text"
                    value={activeDeck.description}
                    onChange={(e) =>
                      handleUpdateDeckMeta('description', e.target.value)
                    }
                    className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Cards Grid & Add Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">
                    Carte del Mazzo ({activeDeck.cards.length})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Clicca su una carta per modificarne immagine, icona o testo.
                  </p>
                </div>

                <button
                  onClick={handleStartAddCard}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi Carta</span>
                </button>
              </div>

              {/* Cards List Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {activeDeck.cards.map((card, idx) => (
                  <div
                    key={`${card.id}-${idx}`}
                    className="aspect-[3/4] bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-between text-center relative group hover:border-amber-500/60 transition-all shadow-md"
                  >
                    {/* Top action icons */}
                    <div className="w-full flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          playSound('click');
                          setEditingCard({ ...card });
                          setIsAddingNewCard(false);
                        }}
                        title="Modifica carta"
                        className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        title="Elimina carta"
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Visual */}
                    <div className="my-auto flex flex-col items-center justify-center">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.label}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-700 shadow"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
                          <DynamicIcon name={card.iconName} className="w-7 h-7" />
                        </div>
                      )}

                      <span className="mt-2 text-xs font-bold text-white line-clamp-1">
                        {card.label}
                      </span>

                      {card.secondaryLabel && (
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {card.secondaryLabel}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-500 font-mono uppercase">
                      Carta #{card.id.slice(-4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {isAddingNewCard ? 'Crea Nuova Carta' : 'Modifica Carta'}
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Text Labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome / Scritta Principale
                  </label>
                  <input
                    type="text"
                    value={editingCard.label}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, label: e.target.value })
                    }
                    placeholder="es. Panda, Stella, Roma..."
                    className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Seconda Scritta (Traduzione / Indizio)
                  </label>
                  <input
                    type="text"
                    value={editingCard.secondaryLabel || ''}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        secondaryLabel: e.target.value,
                      })
                    }
                    placeholder="es. Giant Panda, Star, Capitale..."
                    className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Visual Source: Custom Upload or Icon Picker */}
              <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-800/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-200">
                    Scegli Immagine o Icona
                  </span>

                  {/* Upload button */}
                  <input
                    type="file"
                    ref={cardImageUploadRef}
                    accept="image/*"
                    onChange={handleCardImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => cardImageUploadRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Carica Foto dal Dispositivo</span>
                  </button>
                </div>

                {/* If image is already set, show preview and remove button */}
                {editingCard.imageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-xl border border-slate-700 mb-3">
                    <img
                      src={editingCard.imageUrl}
                      alt="Anteprima"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white block">
                        Foto Caricata
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Ottimizzata per il salvataggio locale
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setEditingCard({
                          ...editingCard,
                          imageUrl: undefined,
                          iconName: 'Sparkles',
                        })
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
                    >
                      Rimuovi Foto
                    </button>
                  </div>
                )}

                {/* Icon categories & picker */}
                {!editingCard.imageUrl && (
                  <>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setIconCategoryFilter(cat)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            iconCategoryFilter === cat
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Cerca icona (es. gatto, sole, trofeo...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs border border-slate-700 mb-3 focus:outline-none focus:border-amber-400"
                    />

                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                      {filteredIconKeys.map((key) => {
                        const isSelected = editingCard.iconName === key;
                        return (
                          <button
                            key={key}
                            onClick={() =>
                              setEditingCard({
                                ...editingCard,
                                iconName: key,
                                imageUrl: undefined,
                              })
                            }
                            title={ICON_LIBRARY[key].label}
                            className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <DynamicIcon name={key} className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveCard}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salva Carta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
