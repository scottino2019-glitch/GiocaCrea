import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Upload,
  Sparkles,
  HelpCircle,
  Eye,
  Smile,
  ArrowRightLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { Deck, CardItem, MatchMode } from '../types/game';
import { ICON_LIBRARY, DynamicIcon, COLOR_PALETTE } from '../utils/iconMap';
import { processImageFile } from '../utils/storage';
import { playSound } from '../utils/sound';

interface QuickCreateMemoryModalProps {
  initialDeck?: Deck | null;
  onSaveDeck: (deck: Deck) => void;
  onSelectDeck: (deckId: string) => void;
  onClose: () => void;
}

export function QuickCreateMemoryModal({
  initialDeck,
  onSaveDeck,
  onSelectDeck,
  onClose,
}: QuickCreateMemoryModalProps) {
  const isEditing = Boolean(initialDeck && !initialDeck.isBuiltIn);

  const [title, setTitle] = useState<string>(initialDeck?.title || 'Il Mio Memory');
  const [description, setDescription] = useState<string>(
    initialDeck?.description || 'Trova tutte le coppie nascoste'
  );
  const [matchMode, setMatchMode] = useState<MatchMode>(
    initialDeck?.matchMode || 'identical'
  );
  const [cards, setCards] = useState<CardItem[]>(
    initialDeck?.cards.map((c) => ({ ...c })) || [
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
        label: 'Quadrifoglio',
        iconName: 'Flower2',
        color: COLOR_PALETTE[1].value,
      },
    ]
  );

  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [iconPickerIndex, setIconPickerIndex] = useState<number | null>(null);
  const [iconSearchTerm, setIconSearchTerm] = useState<string>('');
  const [showHelpBanner, setShowHelpBanner] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCardIndex, setUploadCardIndex] = useState<number | null>(null);

  const currentEditingCard = cards[activeCardIndex] || cards[0];

  // Upload image for a card
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadCardIndex === null) return;

    try {
      const dataUrl = await processImageFile(file, 400);
      const updated = [...cards];
      updated[uploadCardIndex] = {
        ...updated[uploadCardIndex],
        imageUrl: dataUrl,
        iconName: undefined,
      };

      // Auto-set label from filename if generic
      if (
        !updated[uploadCardIndex].label ||
        updated[uploadCardIndex].label.startsWith('Elemento') ||
        updated[uploadCardIndex].label.startsWith('Carta')
      ) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        updated[uploadCardIndex].label =
          cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }

      setCards(updated);
      playSound('click');
    } catch (err) {
      console.error('Image upload failed', err);
      alert('Impossibile caricare questa immagine. Prova con un formato PNG o JPG.');
    } finally {
      setUploadCardIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUploadForIndex = (index: number) => {
    setUploadCardIndex(index);
    fileInputRef.current?.click();
  };

  // Add new card pair
  const handleAddCard = () => {
    playSound('click');
    const newIndex = cards.length + 1;
    const newCard: CardItem = {
      id: 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      label: `Carta ${newIndex}`,
      secondaryLabel: `Parola ${newIndex}`,
      iconName: 'Sparkles',
      color: COLOR_PALETTE[(newIndex - 1) % COLOR_PALETTE.length].value,
    };
    setCards([...cards, newCard]);
    setActiveCardIndex(cards.length);
  };

  // Delete card pair
  const handleDeleteCard = (index: number) => {
    if (cards.length <= 2) {
      alert('Il memory ha bisogno di almeno 2 coppie per poter essere giocato!');
      return;
    }
    playSound('click');
    const updated = cards.filter((_, idx) => idx !== index);
    setCards(updated);
    setActiveCardIndex(Math.max(0, index - 1));
  };

  // Update card fields
  const handleUpdateCard = (field: keyof CardItem, value: any) => {
    const updated = [...cards];
    updated[activeCardIndex] = {
      ...updated[activeCardIndex],
      [field]: value,
    };
    setCards(updated);
  };

  // Select icon
  const handleSelectIcon = (iconKey: string) => {
    if (iconPickerIndex === null) return;
    const updated = [...cards];
    updated[iconPickerIndex] = {
      ...updated[iconPickerIndex],
      iconName: iconKey,
      imageUrl: undefined,
    };
    setCards(updated);
    setIconPickerIndex(null);
    playSound('click');
  };

  // Save deck and start game
  const handleSaveAndPlay = () => {
    if (cards.length < 2) {
      alert('Aggiungi almeno 2 carte prima di salvare!');
      return;
    }

    const cleanTitle = title.trim() || 'Il Mio Memory Personalizzato';
    const deckId =
      isEditing && initialDeck ? initialDeck.id : 'deck-custom-' + Date.now();

    const newDeck: Deck = {
      id: deckId,
      title: cleanTitle,
      description: description.trim() || 'Trova tutte le coppie!',
      matchMode,
      cards: cards.map((c, idx) => ({
        ...c,
        label: c.label.trim() || `Elemento ${idx + 1}`,
        secondaryLabel: c.secondaryLabel?.trim() || c.label.trim(),
      })),
      isBuiltIn: false,
      category: 'I Miei Giochi',
      createdAt: Date.now(),
    };

    onSaveDeck(newDeck);
    onSelectDeck(newDeck.id);
    playSound('win');
    onClose();
  };

  const filteredIcons = Object.keys(ICON_LIBRARY).filter((key) => {
    if (!iconSearchTerm) return true;
    const entry = ICON_LIBRARY[key];
    return (
      entry.label.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
      key.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl my-auto shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Hidden file picker */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? 'Modifica Carte del Memory' : 'Crea un Nuovo Gioco Memory'}
              </h3>
              <p className="text-xs text-slate-400">
                Aggiungi le tue foto, disegni o icone: ogni elemento crea 1 coppia (2 carte) nel gioco!
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

        {/* Explanatory Banner: "Come Funziona il Memory" */}
        {showHelpBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Come funziona:</strong> Ogni elemento che aggiungi nella lista sotto genererà <strong>2 carte coperte</strong> sul tavolo. Quando il giocatore le scopre entrambe, vince la coppia!
              </span>
            </div>
            <button
              onClick={() => setShowHelpBanner(false)}
              className="text-amber-400 hover:text-white text-[11px] underline shrink-0 cursor-pointer"
            >
              Ho capito
            </button>
          </div>
        )}

        {/* Main Body: 2 Columns (Settings & Cards List on Left, Active Card Editor & Live Preview on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Deck metadata + Cards manager */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Title & Mode */}
            <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  1. Nome del tuo Memory
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. La Mia Famiglia, Vacanze al Mare, Animali..."
                  className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  2. Modalità di Abbinamento delle 2 Carte
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setMatchMode('identical');
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      matchMode === 'identical'
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs block text-white font-bold">🖼️ Identiche</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Stessa foto su entrambe le carte (Classico)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setMatchMode('image_to_text');
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      matchMode === 'image_to_text'
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs block text-white font-bold">📖 Foto ↔ Nome</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      1 carta con la foto, 1 carta con la parola
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  3. Le tue Carte / Coppie ({cards.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Nuova Coppia</span>
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                {cards.map((card, idx) => {
                  const isSelected = idx === activeCardIndex;
                  return (
                    <div
                      key={card.id || idx}
                      onClick={() => setActiveCardIndex(idx)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/40'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400 w-4">
                          #{idx + 1}
                        </span>

                        {/* Thumbnail */}
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.label}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                            <DynamicIcon name={card.iconName} className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {card.label}
                          </span>
                          {matchMode === 'image_to_text' && card.secondaryLabel && (
                            <span className="text-[10px] text-amber-400/80 block truncate">
                              ↔ {card.secondaryLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerUploadForIndex(idx);
                          }}
                          title="Carica foto per questa carta"
                          className="p-1 text-slate-400 hover:text-amber-400 rounded-md hover:bg-slate-800 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(idx);
                          }}
                          title="Elimina questa coppia"
                          className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Card Editor + Live 2-Cards Visual Preview */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Live 2-Cards Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Anteprima nel gioco delle 2 carte (# {activeCardIndex + 1})
              </span>

              <div className="flex items-center justify-center gap-3 sm:gap-4 my-2">
                {/* Card 1 */}
                <div className="w-24 sm:w-28 aspect-[3/4] bg-slate-900 border-2 border-amber-500/80 rounded-xl p-2 flex flex-col items-center justify-between shadow-lg relative group">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Carta 1</span>
                  {currentEditingCard.imageUrl ? (
                    <img
                      src={currentEditingCard.imageUrl}
                      alt={currentEditingCard.label}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                      <DynamicIcon name={currentEditingCard.iconName} className="w-6 h-6" />
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-white text-center line-clamp-1">
                    {currentEditingCard.label}
                  </span>
                </div>

                <div className="text-slate-500 flex flex-col items-center">
                  <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                  <span className="text-[9px] font-bold uppercase mt-1">Coppia</span>
                </div>

                {/* Card 2 */}
                <div className="w-24 sm:w-28 aspect-[3/4] bg-slate-900 border-2 border-amber-500/80 rounded-xl p-2 flex flex-col items-center justify-between shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Carta 2</span>
                  {matchMode === 'identical' ? (
                    currentEditingCard.imageUrl ? (
                      <img
                        src={currentEditingCard.imageUrl}
                        alt={currentEditingCard.label}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                        <DynamicIcon name={currentEditingCard.iconName} className="w-6 h-6" />
                      </div>
                    )
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-1">
                      <span className="text-xs font-bold text-amber-300">
                        {currentEditingCard.secondaryLabel || currentEditingCard.label}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1">(Testo)</span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-white text-center line-clamp-1">
                    {matchMode === 'identical'
                      ? currentEditingCard.label
                      : currentEditingCard.secondaryLabel || currentEditingCard.label}
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 text-center mt-1">
                {matchMode === 'identical'
                  ? 'Entrambe le carte avranno la stessa immagine e nome.'
                  : 'Una carta mostrerà l\'immagine e l\'altra mostrerà la parola da abbinare.'}
              </span>
            </div>

            {/* Active Card Customizer Controls */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-white block">
                Modifica Carta #{activeCardIndex + 1}:
              </span>

              {/* Text label */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome Principale della Carta
                </label>
                <input
                  type="text"
                  value={currentEditingCard.label}
                  onChange={(e) => handleUpdateCard('label', e.target.value)}
                  placeholder="es. Mamma, Panda, Torre Eiffel, Palla..."
                  className="w-full bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* If educational mode: secondary label */}
              {matchMode === 'image_to_text' && (
                <div>
                  <label className="text-xs font-semibold text-amber-400 block mb-1">
                    Testo della Seconda Carta (Traduzione o Risposta)
                  </label>
                  <input
                    type="text"
                    value={currentEditingCard.secondaryLabel || ''}
                    onChange={(e) => handleUpdateCard('secondaryLabel', e.target.value)}
                    placeholder="es. Mom, Giant Panda, Paris..."
                    className="w-full bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Visual chooser buttons */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Immagine o Icona per questa carta
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerUploadForIndex(activeCardIndex)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carica Foto dal Dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIconPickerIndex(activeCardIndex)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-400" />
                    <span>Scegli Icona</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <span className="text-xs text-slate-400">
            Totale carte nel gioco: <strong>{cards.length * 2} carte</strong> ({cards.length} coppie)
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>

            <button
              onClick={handleSaveAndPlay}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salva e Gioca Subito</span>
            </button>
          </div>
        </div>

        {/* Mini Icon Picker Modal */}
        {iconPickerIndex !== null && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-md w-full shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-amber-400" />
                  Scegli Icona per la Carta
                </span>
                <button
                  onClick={() => setIconPickerIndex(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Cerca icona (es. stella, cuore, sole, cane...)"
                value={iconSearchTerm}
                onChange={(e) => setIconSearchTerm(e.target.value)}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs border border-slate-700 mb-3 focus:outline-none focus:border-amber-400"
              />

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                {filteredIcons.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSelectIcon(key)}
                    className="aspect-square flex flex-col items-center justify-center rounded-lg p-1.5 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <DynamicIcon name={key} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
