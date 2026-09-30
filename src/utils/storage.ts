import { Deck, CustomPuzzle } from '../types/game';
import { DEFAULT_DECKS } from '../data/defaultDecks';

const STORAGE_KEY = 'giocacrea_custom_decks_v1';
const PUZZLES_STORAGE_KEY = 'giocacrea_custom_puzzles_v1';

export function loadAllDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DECKS;
    }
    const saved = JSON.parse(raw) as Deck[];
    if (!Array.isArray(saved) || saved.length === 0) {
      return DEFAULT_DECKS;
    }

    // Strict deduplication using Map by deck.id:
    // First load built-in defaults, then override with any saved edits, then append custom decks
    const deckMap = new Map<string, Deck>();
    DEFAULT_DECKS.forEach((builtin) => {
      deckMap.set(builtin.id, builtin);
    });

    saved.forEach((savedDeck) => {
      if (savedDeck && savedDeck.id) {
        deckMap.set(savedDeck.id, savedDeck);
      }
    });

    return Array.from(deckMap.values());
  } catch (err) {
    console.error('Failed to load decks from storage', err);
    return DEFAULT_DECKS;
  }
}

export function saveAllDecks(decks: Deck[]) {
  try {
    // Ensure uniqueness before persisting
    const deckMap = new Map<string, Deck>();
    decks.forEach((d) => {
      if (d && d.id) {
        deckMap.set(d.id, d);
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(deckMap.values())));
  } catch (err) {
    console.error('Failed to save decks to storage', err);
  }
}

export function saveDeck(deck: Deck): Deck[] {
  const current = loadAllDecks();
  const deckMap = new Map<string, Deck>();
  current.forEach((d) => deckMap.set(d.id, d));
  deckMap.set(deck.id, deck); // insert or update
  const updated = Array.from(deckMap.values());
  saveAllDecks(updated);
  return updated;
}

export function deleteDeck(deckId: string): Deck[] {
  const current = loadAllDecks();
  const updated = current.filter(d => d.id !== deckId);
  saveAllDecks(updated);
  return updated;
}

export function resetToDefaults(): Deck[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return DEFAULT_DECKS;
}

export function exportDeckAsJSON(deck: Deck) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deck, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanTitle = deck.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  downloadAnchor.setAttribute('download', `giocacrea_${cleanTitle}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseDeckJSON(fileContent: string): Deck {
  const parsed = JSON.parse(fileContent);
  if (!parsed.title || !Array.isArray(parsed.cards)) {
    throw new Error('Formato mazzo non valido. Assicurati che contenga un titolo e la lista carte.');
  }
  return {
    ...parsed,
    id: 'deck-import-' + Date.now(),
    isBuiltIn: false,
    createdAt: Date.now(),
  };
}

// ================= CUSTOM PUZZLES STORAGE =================

export function loadAllCustomPuzzles(): CustomPuzzle[] {
  try {
    const raw = localStorage.getItem(PUZZLES_STORAGE_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw) as CustomPuzzle[];
    if (!Array.isArray(saved)) return [];
    return saved;
  } catch (err) {
    console.error('Failed to load custom puzzles', err);
    return [];
  }
}

export function saveAllCustomPuzzles(puzzles: CustomPuzzle[]) {
  try {
    localStorage.setItem(PUZZLES_STORAGE_KEY, JSON.stringify(puzzles));
  } catch (err) {
    console.error('Failed to save custom puzzles', err);
  }
}

export function saveCustomPuzzle(puzzle: CustomPuzzle): CustomPuzzle[] {
  const current = loadAllCustomPuzzles();
  const existingIdx = current.findIndex((p) => p.id === puzzle.id);
  let updated: CustomPuzzle[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = puzzle;
  } else {
    // Put newest at the front
    updated = [puzzle, ...current];
  }
  saveAllCustomPuzzles(updated);
  return updated;
}

export function deleteCustomPuzzle(puzzleId: string): CustomPuzzle[] {
  const current = loadAllCustomPuzzles();
  const updated = current.filter((p) => p.id !== puzzleId);
  saveAllCustomPuzzles(updated);
  return updated;
}

// Client-side image processor: compresses and resizes to lightweight square data URL
export function processImageFile(file: File, maxDim = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Crop square or keep aspect
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // High quality JPEG compressed for fast localStorage and instant render
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

