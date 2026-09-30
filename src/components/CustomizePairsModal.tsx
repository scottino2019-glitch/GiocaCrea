import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Upload,
  Sparkles,
  ArrowRightLeft,
  Image as ImageIcon,
  Smile,
  Edit2,
} from 'lucide-react';
import { Deck, CardItem } from '../types/game';
import { ICON_LIBRARY, DynamicIcon } from '../utils/iconMap';
import { processImageFile } from '../utils/storage';
import { playSound } from '../utils/sound';

interface CustomizePairsModalProps {
  decks: Deck[];
  currentDeckId: string;
  onSaveDeck: (deck: Deck) => void;
  onSelectDeck: (deckId: string) => void;
  onClose: () => void;
}

export function CustomizePairsModal({
  decks,
  currentDeckId,
  onSaveDeck,
  onSelectDeck,
  onClose,
}: CustomizePairsModalProps) {
  // Find current or first deck
  const activeDeck = decks.find((d) => d.id === currentDeckId) || decks[0];

  const [title, setTitle] = useState<string>(activeDeck?.title || 'I Miei Abbinamenti');
  const [description, setDescription] = useState<string>(
    activeDeck?.description || 'Collega ciascun elemento della colonna sinistra al corrispondente a destra'
  );
  const [leftTitle, setLeftTitle] = useState<string>(activeDeck?.leftColumnTitle || 'Elemento Sinistro');
  const [rightTitle, setRightTitle] = useState<string>(activeDeck?.rightColumnTitle || 'Elemento Destro');
  const [pairs, setPairs] = useState<CardItem[]>(
    activeDeck?.cards.map((c) => ({ ...c })) || []
  );

  // Icon picking modal state
  const [iconPickerTarget, setIconPickerTarget] = useState<{
    pairIndex: number;
    side: 'left' | 'right';
  } | null>(null);
  const [iconSearchTerm, setIconSearchTerm] = useState<string>('');

  // Image upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    pairIndex: number;
    side: 'left' | 'right';
  } | null>(null);

  // Switch between existing decks
  const handleSwitchDeck = (deckId: string) => {
    const found = decks.find((d) => d.id === deckId);
    if (!found) return;
    setTitle(found.title);
    setDescription(found.description);
    setLeftTitle(found.leftColumnTitle || 'Elemento Sinistro');
    setRightTitle(found.rightColumnTitle || 'Elemento Destro');
    setPairs(found.cards.map((c) => ({ ...c })));
    playSound('click');
  };

  // Create brand new blank matching set
  const handleCreateNewBlank = () => {
    playSound('click');
    setTitle('Nuovo Abbinamento');
    setDescription('Collega gli elementi corrispondenti');
    setLeftTitle('Domanda / Elemento A');
    setRightTitle('Risposta / Elemento B');
    setPairs([
      {
        id: 'pair-' + Date.now() + '-1',
        label: 'Italia',
        secondaryLabel: 'Roma',
        iconName: 'Sparkles',
      },
      {
        id: 'pair-' + Date.now() + '-2',
        label: 'Francia',
        secondaryLabel: 'Parigi',
        iconName: 'Sparkles',
      },
      {
        id: 'pair-' + Date.now() + '-3',
        label: 'Spagna',
        secondaryLabel: 'Madrid',
        iconName: 'Sparkles',
      },
      {
        id: 'pair-' + Date.now() + '-4',
        label: 'Germania',
        secondaryLabel: 'Berlino',
        iconName: 'Sparkles',
      },
    ]);
  };

  // Add pair
  const handleAddPair = () => {
    playSound('click');
    const newPair: CardItem = {
      id: 'pair-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      label: `Elemento ${pairs.length + 1}`,
      secondaryLabel: `Risposta ${pairs.length + 1}`,
      iconName: 'Sparkles',
    };
    setPairs([...pairs, newPair]);
  };

  // Remove pair
  const handleRemovePair = (index: number) => {
    if (pairs.length <= 2) {
      alert('Il gioco richiede almeno 2 coppie per poter funzionare!');
      return;
    }
    playSound('click');
    const updated = pairs.filter((_, idx) => idx !== index);
    setPairs(updated);
  };

  // Update pair text
  const handleUpdatePairText = (
    index: number,
    field: 'label' | 'secondaryLabel',
    value: string
  ) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [field]: value };
    setPairs(updated);
  };

  // Handle image upload from file
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    try {
      const dataUrl = await processImageFile(file, 400);
      const updated = [...pairs];
      const targetItem = updated[uploadTarget.pairIndex];

      if (uploadTarget.side === 'left') {
        targetItem.imageUrl = dataUrl;
      } else {
        targetItem.secondaryImageUrl = dataUrl;
      }

      setPairs(updated);
      playSound('click');
    } catch (err) {
      console.error('Failed to load image for pair', err);
      alert('Impossibile caricare questa immagine. Riprova con un formato PNG o JPG.');
    } finally {
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Trigger file upload for specific side
  const triggerImageUpload = (index: number, side: 'left' | 'right') => {
    setUploadTarget({ pairIndex: index, side });
    fileInputRef.current?.click();
  };

  // Set selected icon
  const handleSelectIcon = (iconName: string) => {
    if (!iconPickerTarget) return;
    const updated = [...pairs];
    const item = updated[iconPickerTarget.pairIndex];

    if (iconPickerTarget.side === 'left') {
      item.iconName = iconName;
      item.imageUrl = undefined;
    } else {
      item.secondaryIconName = iconName;
      item.secondaryImageUrl = undefined;
    }

    setPairs(updated);
    setIconPickerTarget(null);
    playSound('click');
  };

  // Clear visual (revert to pure text or sparkle icon)
  const handleClearVisual = (index: number, side: 'left' | 'right') => {
    const updated = [...pairs];
    const item = updated[index];
    if (side === 'left') {
      item.imageUrl = undefined;
      item.iconName = undefined;
    } else {
      item.secondaryImageUrl = undefined;
      item.secondaryIconName = undefined;
    }
    setPairs(updated);
    playSound('click');
  };

  // Save deck and play
  const handleSaveAndPlay = () => {
    const cleanTitle = title.trim() || 'Abbinamento Personalizzato';
    const isNew = !activeDeck || activeDeck.isBuiltIn || activeDeck.title !== title;
    const deckId = isNew ? 'deck-match-' + Date.now() : activeDeck.id;

    const savedDeck: Deck = {
      id: deckId,
      title: cleanTitle,
      description: description.trim(),
      matchMode: 'image_to_text',
      leftColumnTitle: leftTitle.trim() || 'Elemento Sinistro',
      rightColumnTitle: rightTitle.trim() || 'Elemento Destro',
      cards: pairs.map((p, idx) => ({
        ...p,
        label: p.label.trim() || `Coppia ${idx + 1}`,
        secondaryLabel: p.secondaryLabel?.trim() || `Risposta ${idx + 1}`,
      })),
      isBuiltIn: false,
      category: 'Abbinamenti',
      createdAt: Date.now(),
    };

    onSaveDeck(savedDeck);
    onSelectDeck(savedDeck.id);
    playSound('win');
    onClose();
  };

  const filteredIcons = Object.keys(ICON_LIBRARY).filter((key) => {
    if (!iconSearchTerm) return true;
    const entry = ICON_LIBRARY[key];
    return (
      entry.label.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
      key.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Hidden File Input for photos */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Personalizza Gioco degli Abbinamenti
              </h3>
              <p className="text-xs text-slate-400">
                Configura liberamente i due lati da collegare (Testo, Foto, Domande/Risposte)
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

        {/* Set Selector / Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Modifica Set:</span>
            <select
              value={activeDeck.id}
              onChange={(e) => handleSwitchDeck(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-400 max-w-[200px] truncate"
            >
              {decks.map((d, idx) => (
                <option key={`${d.id}-${idx}`} value={d.id}>
                  {d.title} ({d.cards.length} coppie)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateNewBlank}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Crea Nuovo Set Abbinamento</span>
          </button>
        </div>

        {/* Configuration fields */}
        <div className="space-y-3 mb-4 shrink-0">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Titolo dell'Abbinamento
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Capitali del Mondo, Tabellina del 5, Parole e Contrari..."
              className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* Column headers customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-1">
                <span>Intestazione Colonna Sinistra (A)</span>
              </label>
              <input
                type="text"
                value={leftTitle}
                onChange={(e) => setLeftTitle(e.target.value)}
                placeholder="es. Nazione, Domanda, Vocabolo Italiano, Operazione..."
                className="w-full bg-slate-800 text-white rounded-xl px-3 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-1">
                <span>Intestazione Colonna Destra (B)</span>
              </label>
              <input
                type="text"
                value={rightTitle}
                onChange={(e) => setRightTitle(e.target.value)}
                placeholder="es. Capitale, Risposta, Traduzione Inglese, Risultato..."
                className="w-full bg-slate-800 text-white rounded-xl px-3 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Pairs List Section */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
          <div className="flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm py-1 z-10 border-b border-slate-800/80 mb-2">
            <span className="text-xs font-bold text-slate-300">
              Elenco Coppie da Collegare ({pairs.length})
            </span>
            <button
              onClick={handleAddPair}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Coppia</span>
            </button>
          </div>

          {pairs.map((pair, index) => (
            <div
              key={pair.id || index}
              className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 hover:border-slate-600 transition-colors"
            >
              <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0 text-center">
                #{index + 1}
              </span>

              {/* Left Side: Input + Optional Visual */}
              <div className="flex-1 w-full flex items-center gap-2">
                {/* Visual Thumbnail / Icon Trigger */}
                <div className="relative group shrink-0">
                  {pair.imageUrl ? (
                    <img
                      src={pair.imageUrl}
                      alt={pair.label}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-600 cursor-pointer"
                      onClick={() => triggerImageUpload(index, 'left')}
                    />
                  ) : pair.iconName ? (
                    <div
                      onClick={() => setIconPickerTarget({ pairIndex: index, side: 'left' })}
                      className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 hover:border-amber-400 cursor-pointer transition-colors"
                      title="Clicca per cambiare icona"
                    >
                      <DynamicIcon name={pair.iconName} className="w-4 h-4" />
                    </div>
                  ) : (
                    <div
                      onClick={() => setIconPickerTarget({ pairIndex: index, side: 'left' })}
                      className="w-9 h-9 rounded-lg bg-slate-800/60 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:border-amber-400 cursor-pointer transition-colors"
                      title="Aggiungi icona o foto"
                    >
                      <Smile className="w-4 h-4" />
                    </div>
                  )}

                  {/* Actions for Left Visual */}
                  <div className="hidden group-hover:flex absolute -top-8 left-0 bg-slate-950 border border-slate-700 rounded-md p-0.5 gap-1 z-20 shadow-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => triggerImageUpload(index, 'left')}
                      className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-200 rounded"
                    >
                      Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconPickerTarget({ pairIndex: index, side: 'left' })}
                      className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-200 rounded"
                    >
                      Icona
                    </button>
                    {(pair.imageUrl || pair.iconName) && (
                      <button
                        type="button"
                        onClick={() => handleClearVisual(index, 'left')}
                        className="px-1.5 py-0.5 hover:bg-rose-950 text-rose-400 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Left Label */}
                <input
                  type="text"
                  value={pair.label}
                  onChange={(e) => handleUpdatePairText(index, 'label', e.target.value)}
                  placeholder="Elemento Sinistro"
                  className="flex-1 bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Connecting icon */}
              <div className="shrink-0 text-slate-500 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-amber-500/70" />
              </div>

              {/* Right Side: Input + Optional Visual */}
              <div className="flex-1 w-full flex items-center gap-2">
                {/* Right Label */}
                <input
                  type="text"
                  value={pair.secondaryLabel || ''}
                  onChange={(e) => handleUpdatePairText(index, 'secondaryLabel', e.target.value)}
                  placeholder="Elemento Destro Corrispondente"
                  className="flex-1 bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
                />

                {/* Optional Right Visual Trigger */}
                <div className="relative group shrink-0">
                  {pair.secondaryImageUrl ? (
                    <img
                      src={pair.secondaryImageUrl}
                      alt="Destra"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-600 cursor-pointer"
                      onClick={() => triggerImageUpload(index, 'right')}
                    />
                  ) : pair.secondaryIconName ? (
                    <div
                      onClick={() => setIconPickerTarget({ pairIndex: index, side: 'right' })}
                      className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 hover:border-amber-400 cursor-pointer transition-colors"
                      title="Clicca per cambiare icona"
                    >
                      <DynamicIcon name={pair.secondaryIconName} className="w-4 h-4" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerImageUpload(index, 'right')}
                      className="w-9 h-9 rounded-lg bg-slate-800/40 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:border-amber-400 cursor-pointer transition-colors"
                      title="Aggiungi foto opzionale a destra"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Actions for Right Visual */}
                  {(pair.secondaryImageUrl || pair.secondaryIconName) && (
                    <div className="hidden group-hover:flex absolute -top-8 right-0 bg-slate-950 border border-slate-700 rounded-md p-0.5 gap-1 z-20 shadow-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => triggerImageUpload(index, 'right')}
                        className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-200 rounded"
                      >
                        Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setIconPickerTarget({ pairIndex: index, side: 'right' })}
                        className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-200 rounded"
                      >
                        Icona
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearVisual(index, 'right')}
                        className="px-1.5 py-0.5 hover:bg-rose-950 text-rose-400 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Pair */}
              <button
                type="button"
                onClick={() => handleRemovePair(index)}
                title="Elimina questa coppia"
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3 shrink-0">
          <button
            onClick={handleAddPair}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi un'altra coppia</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveAndPlay}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salva e Gioca Subito</span>
            </button>
          </div>
        </div>

        {/* Popover / Overlay for Icon Picking */}
        {iconPickerTarget && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-md w-full shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-amber-400" />
                  Scegli Icona per la Coppia
                </span>
                <button
                  onClick={() => setIconPickerTarget(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Cerca icona (es. stella, cane, libro...)"
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
