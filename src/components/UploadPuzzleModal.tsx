import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { CustomPuzzle } from '../types/game';
import { processImageFile } from '../utils/storage';
import { playSound } from '../utils/sound';

interface UploadPuzzleModalProps {
  onClose: () => void;
  onSavePuzzle: (puzzle: CustomPuzzle) => void;
}

export function UploadPuzzleModal({ onClose, onSavePuzzle }: UploadPuzzleModalProps) {
  const [title, setTitle] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Compress and optimize image for responsive local storage
      const dataUrl = await processImageFile(file, 500);
      setPreviewUrl(dataUrl);

      // Auto-set title from file name if empty
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const formattedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        setTitle(formattedTitle);
      }
      playSound('click');
    } catch (err) {
      console.error('Failed to process image', err);
      setErrorMessage('Impossibile caricare questa immagine. Prova con un file JPG o PNG.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!previewUrl) {
      setErrorMessage('Seleziona una foto per il puzzle prima di salvare.');
      return;
    }

    const finalTitle = title.trim() || 'Mio Puzzle';
    const newPuzzle: CustomPuzzle = {
      id: 'puzzle-custom-' + Date.now(),
      title: finalTitle,
      imageUrl: previewUrl,
      createdAt: Date.now(),
    };

    playSound('win');
    onSavePuzzle(newPuzzle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Carica e Salva Nuovo Puzzle</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Picker / Preview Box */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/70 bg-slate-800/40 hover:bg-slate-800/70 flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition-all mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200">
                {isProcessing ? 'Elaborazione immagine...' : 'Tocca o clicca qui per scegliere una foto'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                PNG, JPG o WebP · Verrà salvata in modo permanente sul tuo dispositivo
              </span>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-square max-h-56 mx-auto group">
              <img
                src={previewUrl}
                alt="Anteprima puzzle"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity text-white text-xs font-semibold"
              >
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Cambia Foto</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/50 rounded-lg p-2.5">
              {errorMessage}
            </p>
          )}

          {/* Title Field */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome del Puzzle
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Il mio cane, Viaggio in montagna, Compleanno..."
              className="w-full bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm border border-slate-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/40 border border-slate-800 p-2.5 rounded-lg">
            💾 <span className="font-semibold text-slate-300">Salvataggio automatico:</span> Il puzzle viene memorizzato nel tuo browser. Potrai giocarci sia a scorrimento che a tessere ed esportarlo in HTML in qualsiasi momento.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!previewUrl || isProcessing}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salva nei Miei Puzzle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
