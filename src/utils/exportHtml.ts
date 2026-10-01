import { Deck } from '../types/game';
import { ICON_LIBRARY } from './iconMap';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export type ExportGameType = 'memory' | 'sliding_puzzle' | 'tile_puzzle' | 'match_pairs' | 'all';

// Helper to convert an image path to Base64 dataURL in the browser
export async function imageToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 400; // Optimal size for standalone file
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
          return;
        }
      } catch (e) {
        console.warn('Canvas export failed, using original url', e);
      }
      resolve(url);
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

// Convert deck cards' images to base64 so exported HTML is 100% self-contained
export async function bundleDeckWithBase64(deck: Deck): Promise<Deck> {
  const bundledCards = await Promise.all(
    deck.cards.map(async (card) => {
      if (card.imageUrl) {
        const dataUrl = await imageToDataUrl(card.imageUrl);
        return { ...card, imageUrl: dataUrl };
      }
      return card;
    })
  );

  let coverImage = deck.coverImage;
  if (coverImage) {
    coverImage = await imageToDataUrl(coverImage);
  }

  return {
    ...deck,
    coverImage,
    cards: bundledCards,
  };
}

// Generate an SVG markup for an icon name from our library
export function getIconSvgMarkup(iconName?: string): string {
  if (!iconName) return '';
  const entry = ICON_LIBRARY[iconName];
  if (!entry) return '';
  try {
    return renderToStaticMarkup(
      React.createElement(entry.icon, {
        size: 32,
        strokeWidth: 2,
        color: '#f59e0b',
      })
    );
  } catch (err) {
    console.error('Error rendering icon SVG', err);
    return '';
  }
}

export function generateStandaloneHtml(
  deck: Deck,
  puzzleImageUrl: string,
  gameType: ExportGameType = 'all'
): string {
  // Pre-generate SVG markup for every icon in ICON_LIBRARY
  const iconSvgMap: Record<string, string> = {};
  Object.keys(ICON_LIBRARY).forEach((iconKey) => {
    const svg = getIconSvgMarkup(iconKey);
    if (svg) {
      iconSvgMap[iconKey] = svg;
    }
  });

  const jsonIcons = JSON.stringify(iconSvgMap).replace(/</g, '\\u003c');
  const jsonDeck = JSON.stringify(deck).replace(/</g, '\\u003c');
  const puzzleImg = puzzleImageUrl.replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.title} - Gioco Autonomo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0f19;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }
    header {
      width: 100%;
      max-width: 900px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      margin-bottom: 20px;
      gap: 12px;
    }
    .brand {
      font-size: 1.1rem;
      font-weight: 800;
      color: #f59e0b;
      letter-spacing: -0.02em;
    }
    .nav-tabs {
      display: flex;
      gap: 6px;
      background: #1f2937;
      padding: 4px;
      border-radius: 12px;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn.active {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 700;
    }
    .hud {
      width: 100%;
      max-width: 900px;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 12px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.85rem;
    }
    .hud-metrics {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .metric {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .metric-label { color: #94a3b8; }
    .metric-val { font-weight: 700; font-family: monospace; color: #f59e0b; }
    .action-btn {
      background: #1f2937;
      border: 1px solid #374151;
      color: #e2e8f0;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .action-btn:hover { background: #374151; color: #fff; }
    .action-btn.primary { background: #f59e0b; color: #0f172a; border-color: #f59e0b; }
    .action-btn.primary:hover { background: #fbbf24; }

    /* MEMORY GAME STYLES */
    .game-arena {
      width: 100%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .memory-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    @media (max-width: 500px) {
      .memory-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
    }
    .card {
      aspect-ratio: 3/4;
      perspective: 1000px;
      cursor: pointer;
      user-select: none;
    }
    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transform-style: preserve-3d;
    }
    .card.flipped .card-inner, .card.matched .card-inner {
      transform: rotateY(180deg);
    }
    .card-face {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      backface-visibility: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      text-align: center;
      border: 2px solid transparent;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }
    .card-back {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border-color: #334155;
      color: #f59e0b;
    }
    .card-back:hover { border-color: #f59e0b; }
    .card-front {
      background: #1e293b;
      border-color: #f59e0b;
      transform: rotateY(180deg);
    }
    .card.matched .card-front {
      border-color: #10b981;
      background: #064e3b;
    }
    .card-img {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 6px;
    }
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
      margin-bottom: 6px;
      border: 1px solid #334155;
      padding: 6px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
    }
    .card-icon svg {
      width: 100%;
      height: 100%;
      stroke: currentColor;
      display: block;
    }
    .card-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }

    /* SLIDING PUZZLE STYLES */
    .puzzle-box {
      width: 100%;
      max-width: 420px;
      aspect-ratio: 1/1;
      background: #020617;
      border: 2px solid #1f2937;
      border-radius: 16px;
      padding: 8px;
      display: grid;
      gap: 6px;
      margin: 0 auto;
    }
    .puzzle-tile {
      background-size: cover;
      border-radius: 10px;
      border: 1px solid #334155;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      font-weight: bold;
      font-size: 1.2rem;
      color: #f59e0b;
      transition: transform 0.1s ease;
    }
    .puzzle-tile:hover { transform: scale(0.98); }
    .puzzle-tile.empty {
      background: transparent !important;
      border: 1px dashed #1e293b;
      cursor: default;
    }
    .tile-badge {
      position: absolute;
      top: 4px;
      left: 4px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 4px;
    }

    /* MATCH PAIRS STYLES */
    .match-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    .match-item {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.15s;
    }
    .match-item:hover { border-color: #f59e0b; }
    .match-item.selected {
      background: rgba(245, 158, 11, 0.2);
      border-color: #f59e0b;
      outline: 2px solid #f59e0b;
    }
    .match-item.matched {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      opacity: 0.6;
      cursor: default;
    }

    /* WIN MODAL */
    .win-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .win-overlay.show { display: flex; }
    .win-modal {
      background: #111827;
      border: 2px solid #f59e0b;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .win-modal h2 { font-size: 1.5rem; margin-bottom: 8px; color: #fff; }
    .win-modal p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 20px; }

    footer {
      margin-top: 32px;
      font-size: 0.75rem;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">GiocaCrea · ${deck.title}</div>
    <div class="nav-tabs" id="tabContainer">
      <button class="tab-btn active" onclick="switchGame('memory')">Memory</button>
      <button class="tab-btn" onclick="switchGame('puzzle')">Puzzle Scivolo</button>
      <button class="tab-btn" onclick="switchGame('tile_swap')">Puzzle Tessere</button>
      <button class="tab-btn" onclick="switchGame('match')">Collega Coppie</button>
    </div>
  </header>

  <div class="hud">
    <div class="hud-metrics">
      <div class="metric">
        <span class="metric-label">Tempo:</span>
        <span class="metric-val" id="timerDisplay">00:00</span>
      </div>
      <div class="metric">
        <span class="metric-label">Mosse:</span>
        <span class="metric-val" id="movesDisplay">0</span>
      </div>
      <div class="metric" id="progressMetric">
        <span class="metric-label">Punteggio:</span>
        <span class="metric-val" id="scoreDisplay">0 / 6</span>
      </div>
    </div>

    <div>
      <button class="action-btn" onclick="peekHint()">Sbircia</button>
      <button class="action-btn primary" onclick="restartCurrentGame()">Ricomincia</button>
    </div>
  </div>

  <main class="game-arena">
    <!-- MEMORY CONTAINER -->
    <div id="memoryContainer" class="memory-grid"></div>

    <!-- PUZZLE SCIVOLO CONTAINER -->
    <div id="puzzleContainer" class="puzzle-box" style="display:none;"></div>

    <!-- PUZZLE TESSERE CONTAINER -->
    <div id="tileSwapContainer" class="puzzle-box" style="display:none;"></div>

    <!-- MATCH PAIRS CONTAINER -->
    <div id="matchContainer" class="match-columns" style="display:none;"></div>
  </main>

  <!-- VICTORY MODAL -->
  <div class="win-overlay" id="winModal">
    <div class="win-modal">
      <div style="font-size:3rem; margin-bottom:12px;">🏆</div>
      <h2>Vittoria Perfetta!</h2>
      <p id="winDescription">Hai completato il gioco con successo!</p>
      <button class="action-btn primary" style="padding:10px 24px; font-size:1rem;" onclick="closeWinModal()">Gioca di Nuovo</button>
    </div>
  </div>

  <footer>
    Gioco autonomo generato con GiocaCrea · 100% Offline nel tuo browser
  </footer>

  <script>
    const DECK = ${jsonDeck};
    const ICONS = ${jsonIcons};
    const PUZZLE_IMG = "${puzzleImg}";

    // SOUND SYNTHESIZER
    let audioCtx = null;
    function playAudio(type) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        if (type === 'flip' || type === 'click') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(now); osc.stop(now + 0.09);
        } else if (type === 'match') {
          [660, 880].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0.15, now + i * 0.08);
            g.gain.linearRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.22);
          });
        } else if (type === 'win') {
          [523, 659, 783, 1046].forEach((f, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.frequency.setValueAtTime(f, now + i * 0.12);
            g.gain.setValueAtTime(0.2, now + i * 0.12);
            g.gain.linearRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.4);
          });
        }
      } catch (e) {}
    }

    // STATE
    let currentGame = '${gameType === 'all' ? 'memory' : gameType}';
    let moves = 0;
    let seconds = 0;
    let timerInterval = null;
    let timerStarted = false;

    function startTimer() {
      if (!timerStarted) {
        timerStarted = true;
        timerInterval = setInterval(() => {
          seconds++;
          const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
          const rem = (seconds % 60).toString().padStart(2, '0');
          document.getElementById('timerDisplay').innerText = mins + ':' + rem;
        }, 1000);
      }
    }

    function resetTimer() {
      clearInterval(timerInterval);
      timerInterval = null;
      timerStarted = false;
      seconds = 0;
      moves = 0;
      document.getElementById('timerDisplay').innerText = '00:00';
      document.getElementById('movesDisplay').innerText = '0';
    }

    function addMove() {
      moves++;
      document.getElementById('movesDisplay').innerText = moves;
      startTimer();
    }

    function showWinModal(msg) {
      clearInterval(timerInterval);
      playAudio('win');
      document.getElementById('winDescription').innerText = msg;
      document.getElementById('winModal').classList.add('show');
    }

    function closeWinModal() {
      document.getElementById('winModal').classList.remove('show');
      restartCurrentGame();
    }

    // ------------------- MEMORY GAME -------------------
    let memoryCards = [];
    let flippedCards = [];
    let memoryMatched = 0;
    let memoryLock = false;

    function initMemory() {
      resetTimer();
      const container = document.getElementById('memoryContainer');
      container.innerHTML = '';
      flippedCards = [];
      memoryMatched = 0;
      memoryLock = false;

      const pairsCount = Math.min(6, DECK.cards.length);
      const chosen = [...DECK.cards].sort(() => Math.random() - 0.5).slice(0, pairsCount);

      const boardItems = [];
      chosen.forEach((c) => {
        boardItems.push({ ...c, pairId: c.id, uid: Math.random(), isSecondary: false });
        boardItems.push({ ...c, pairId: c.id, uid: Math.random(), isSecondary: true });
      });
      memoryCards = boardItems.sort(() => Math.random() - 0.5);

      document.getElementById('scoreDisplay').innerText = '0 / ' + pairsCount;

      memoryCards.forEach((c, idx) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.id = 'mcard-' + idx;

        let content = '';
        if (c.imageUrl && (!c.isSecondary || DECK.matchMode !== 'image_to_text')) {
          content = '<img class="card-img" src="' + c.imageUrl + '" alt="' + c.label + '">';
        } else if (c.iconName && (!c.isSecondary || DECK.matchMode !== 'image_to_text')) {
          const svg = ICONS[c.iconName] || '';
          if (svg) {
            content = '<div class="card-icon">' + svg + '</div>';
          } else {
            content = '<div class="card-icon"><span style="font-size:1.8rem;line-height:1;">' + c.iconName + '</span></div>';
          }
        }
        const labelText = (c.isSecondary && DECK.matchMode === 'image_to_text' && c.secondaryLabel) ? c.secondaryLabel : c.label;

        cardEl.innerHTML = '<div class="card-inner">' +
          '<div class="card-face card-back"><div style="font-weight:900; font-size:1.3rem;">?</div></div>' +
          '<div class="card-face card-front">' + content + '<div class="card-label">' + labelText + '</div></div>' +
        '</div>';

        cardEl.onclick = () => onCardClick(idx);
        container.appendChild(cardEl);
      });
    }

    function onCardClick(idx) {
      if (memoryLock) return;
      const el = document.getElementById('mcard-' + idx);
      if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

      playAudio('flip');
      addMove();
      el.classList.add('flipped');
      flippedCards.push(idx);

      if (flippedCards.length === 2) {
        memoryLock = true;
        const [a, b] = flippedCards;
        const cardA = memoryCards[a];
        const cardB = memoryCards[b];

        if (cardA.pairId === cardB.pairId) {
          setTimeout(() => {
            playAudio('match');
            document.getElementById('mcard-' + a).classList.add('matched');
            document.getElementById('mcard-' + b).classList.add('matched');
            flippedCards = [];
            memoryLock = false;
            memoryMatched++;
            const totalPairs = Math.min(6, DECK.cards.length);
            document.getElementById('scoreDisplay').innerText = memoryMatched + ' / ' + totalPairs;
            if (memoryMatched >= totalPairs) {
              showWinModal('Hai trovato tutte le coppie in ' + moves + ' mosse!');
            }
          }, 400);
        } else {
          setTimeout(() => {
            document.getElementById('mcard-' + a).classList.remove('flipped');
            document.getElementById('mcard-' + b).classList.remove('flipped');
            flippedCards = [];
            memoryLock = false;
          }, 800);
        }
      }
    }

    // ------------------- SLIDING 15-PUZZLE -------------------
    let puzzleSize = 3;
    let puzzleBoard = [];

    function initPuzzle() {
      resetTimer();
      const container = document.getElementById('puzzleContainer');
      container.innerHTML = '';
      container.style.gridTemplateColumns = 'repeat(' + puzzleSize + ', 1fr)';
      container.style.gridTemplateRows = 'repeat(' + puzzleSize + ', 1fr)';

      const total = puzzleSize * puzzleSize;
      const emptyVal = total - 1;
      let valid = false;

      while (!valid) {
        puzzleBoard = Array.from({length: total}, (_, i) => i).sort(() => Math.random() - 0.5);
        // Inversions check
        let inv = 0;
        const noEmpty = puzzleBoard.filter(x => x !== emptyVal);
        for (let i = 0; i < noEmpty.length - 1; i++) {
          for (let j = i + 1; j < noEmpty.length; j++) {
            if (noEmpty[i] > noEmpty[j]) inv++;
          }
        }
        if (puzzleSize % 2 === 1 && inv % 2 === 0) valid = true;
      }

      document.getElementById('scoreDisplay').innerText = '3x3 Puzzle';
      renderPuzzle();
    }

    function renderPuzzle() {
      const container = document.getElementById('puzzleContainer');
      container.innerHTML = '';
      const emptyVal = puzzleSize * puzzleSize - 1;

      puzzleBoard.forEach((val, idx) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile' + (val === emptyVal ? ' empty' : '');
        if (val !== emptyVal) {
          const row = Math.floor(val / puzzleSize);
          const col = val % puzzleSize;
          const bgX = (col / (puzzleSize - 1)) * 100;
          const bgY = (row / (puzzleSize - 1)) * 100;

          if (PUZZLE_IMG) {
            tile.style.backgroundImage = 'url(' + PUZZLE_IMG + ')';
            tile.style.backgroundSize = (puzzleSize * 100) + '% ' + (puzzleSize * 100) + '%';
            tile.style.backgroundPosition = bgX + '% ' + bgY + '%';
            tile.innerHTML = '<span class="tile-badge">' + (val + 1) + '</span>';
          } else {
            tile.innerText = val + 1;
          }
          tile.onclick = () => onTileClick(idx);
        }
        container.appendChild(tile);
      });
    }

    function onTileClick(idx) {
      const emptyVal = puzzleSize * puzzleSize - 1;
      const emptyIdx = puzzleBoard.indexOf(emptyVal);
      const row1 = Math.floor(idx / puzzleSize), col1 = idx % puzzleSize;
      const row2 = Math.floor(emptyIdx / puzzleSize), col2 = emptyIdx % puzzleSize;

      if ((Math.abs(row1 - row2) === 1 && col1 === col2) || (Math.abs(col1 - col2) === 1 && row1 === row2)) {
        playAudio('click');
        addMove();
        puzzleBoard[emptyIdx] = puzzleBoard[idx];
        puzzleBoard[idx] = emptyVal;
        renderPuzzle();

        if (puzzleBoard.every((v, i) => v === i)) {
          showWinModal('Fantastico! Hai risolto il puzzle scivolo in ' + moves + ' mosse!');
        }
      }
    }

    // ------------------- TILE SWAP PUZZLE -------------------
    let swapTiles = [];
    let swapSelected = null;

    function initTileSwap() {
      resetTimer();
      const container = document.getElementById('tileSwapContainer');
      container.innerHTML = '';
      container.style.gridTemplateColumns = 'repeat(3, 1fr)';
      container.style.gridTemplateRows = 'repeat(3, 1fr)';

      swapTiles = Array.from({length: 9}, (_, i) => i).sort(() => Math.random() - 0.5);
      swapSelected = null;
      renderTileSwap();
    }

    function renderTileSwap() {
      const container = document.getElementById('tileSwapContainer');
      container.innerHTML = '';
      const correct = swapTiles.filter((v, i) => v === i).length;
      document.getElementById('scoreDisplay').innerText = correct + ' / 9 Corrette';

      swapTiles.forEach((val, idx) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        const row = Math.floor(val / 3), col = val % 3;
        const bgX = (col / 2) * 100, bgY = (row / 2) * 100;

        if (PUZZLE_IMG) {
          tile.style.backgroundImage = 'url(' + PUZZLE_IMG + ')';
          tile.style.backgroundSize = '300% 300%';
          tile.style.backgroundPosition = bgX + '% ' + bgY + '%';
        } else {
          tile.innerText = val + 1;
        }

        if (swapSelected === idx) {
          tile.style.outline = '3px solid #f59e0b';
        }
        if (val === idx) {
          tile.style.borderColor = '#10b981';
        }

        tile.onclick = () => onSwapClick(idx);
        container.appendChild(tile);
      });
    }

    function onSwapClick(idx) {
      if (swapSelected === null) {
        playAudio('click');
        swapSelected = idx;
        renderTileSwap();
      } else if (swapSelected === idx) {
        swapSelected = null;
        renderTileSwap();
      } else {
        playAudio('click');
        addMove();
        const tmp = swapTiles[swapSelected];
        swapTiles[swapSelected] = swapTiles[idx];
        swapTiles[idx] = tmp;
        swapSelected = null;
        renderTileSwap();

        if (swapTiles.every((v, i) => v === i)) {
          showWinModal('Hai ricomposto tutte le tessere in ' + moves + ' scambi!');
        }
      }
    }

    // ------------------- MATCH PAIRS -------------------
    let matchPairsLeft = [];
    let matchPairsRight = [];
    let matchSelectedLeft = null;
    let matchSelectedRight = null;
    let matchScore = 0;

    function initMatch() {
      resetTimer();
      const container = document.getElementById('matchContainer');
      container.innerHTML = '';
      const count = Math.min(6, DECK.cards.length);
      const chosen = [...DECK.cards].sort(() => Math.random() - 0.5).slice(0, count);

      matchPairsLeft = chosen.map(c => ({ id: c.id, label: c.label, img: c.imageUrl, iconName: c.iconName, matched: false }));
      matchPairsRight = [...chosen].sort(() => Math.random() - 0.5).map(c => ({
        id: c.id,
        label: (DECK.matchMode === 'image_to_text' && c.secondaryLabel) ? c.secondaryLabel : c.label,
        secondaryImg: c.secondaryImageUrl,
        secondaryIconName: c.secondaryIconName,
        matched: false
      }));

      matchSelectedLeft = null;
      matchSelectedRight = null;
      matchScore = 0;
      document.getElementById('scoreDisplay').innerText = '0 / ' + count;
      renderMatch();
    }

    function renderMatch() {
      const container = document.getElementById('matchContainer');
      container.innerHTML = '';

      const leftCol = document.createElement('div');
      leftCol.style.display = 'flex';
      leftCol.style.flexDirection = 'column';
      leftCol.style.gap = '10px';

      const leftHeader = document.createElement('div');
      leftHeader.style.fontSize = '0.75rem';
      leftHeader.style.fontWeight = '700';
      leftHeader.style.color = '#f59e0b';
      leftHeader.style.textTransform = 'uppercase';
      leftHeader.style.textAlign = 'center';
      leftHeader.style.padding = '4px';
      leftHeader.innerText = DECK.leftColumnTitle || 'Elemento Sinistro';
      leftCol.appendChild(leftHeader);

      const rightCol = document.createElement('div');
      rightCol.style.display = 'flex';
      rightCol.style.flexDirection = 'column';
      rightCol.style.gap = '10px';

      const rightHeader = document.createElement('div');
      rightHeader.style.fontSize = '0.75rem';
      rightHeader.style.fontWeight = '700';
      rightHeader.style.color = '#f59e0b';
      rightHeader.style.textTransform = 'uppercase';
      rightHeader.style.textAlign = 'center';
      rightHeader.style.padding = '4px';
      rightHeader.innerText = DECK.rightColumnTitle || 'Elemento Destro';
      rightCol.appendChild(rightHeader);

      matchPairsLeft.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'match-item' + (matchSelectedLeft === item.id ? ' selected' : '') + (item.matched ? ' matched' : '');
        let visualHtml = '';
        if (item.img) {
          visualHtml = '<img src="' + item.img + '" style="width:36px;height:36px;border-radius:6px;object-fit:cover;margin-right:8px;">';
        } else if (item.iconName) {
          if (ICONS[item.iconName]) {
            visualHtml = '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#f59e0b;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:4px;flex-shrink:0;margin-right:8px;">' + ICONS[item.iconName] + '</div>';
          } else {
            visualHtml = '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;background:#0f172a;border:1px solid #334155;border-radius:6px;flex-shrink:0;margin-right:8px;">' + item.iconName + '</div>';
          }
        }
        el.innerHTML = visualHtml + '<span style="overflow:hidden;text-overflow:ellipsis;">' + item.label + '</span>';
        if (!item.matched) {
          el.onclick = () => {
            playAudio('click');
            matchSelectedLeft = item.id;
            renderMatch();
            checkMatchPair();
          };
        }
        leftCol.appendChild(el);
      });

      matchPairsRight.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'match-item' + (matchSelectedRight === item.id ? ' selected' : '') + (item.matched ? ' matched' : '');
        let visualRightHtml = '';
        if (item.secondaryImg) {
          visualRightHtml = '<img src="' + item.secondaryImg + '" style="width:36px;height:36px;border-radius:6px;object-fit:cover;margin-right:8px;">';
        } else if (item.secondaryIconName) {
          if (ICONS[item.secondaryIconName]) {
            visualRightHtml = '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#f59e0b;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:4px;flex-shrink:0;margin-right:8px;">' + ICONS[item.secondaryIconName] + '</div>';
          } else {
            visualRightHtml = '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;background:#0f172a;border:1px solid #334155;border-radius:6px;flex-shrink:0;margin-right:8px;">' + item.secondaryIconName + '</div>';
          }
        }
        el.innerHTML = visualRightHtml + '<span style="overflow:hidden;text-overflow:ellipsis;">' + item.label + '</span>';
        if (!item.matched) {
          el.onclick = () => {
            playAudio('click');
            matchSelectedRight = item.id;
            renderMatch();
            checkMatchPair();
          };
        }
        rightCol.appendChild(el);
      });

      container.appendChild(leftCol);
      container.appendChild(rightCol);
    }

    function checkMatchPair() {
      if (matchSelectedLeft && matchSelectedRight) {
        addMove();
        if (matchSelectedLeft === matchSelectedRight) {
          playAudio('match');
          matchPairsLeft.find(x => x.id === matchSelectedLeft).matched = true;
          matchPairsRight.find(x => x.id === matchSelectedRight).matched = true;
          matchSelectedLeft = null;
          matchSelectedRight = null;
          matchScore++;
          const count = Math.min(6, DECK.cards.length);
          document.getElementById('scoreDisplay').innerText = matchScore + ' / ' + count;
          renderMatch();
          if (matchScore >= count) {
            showWinModal('Tutte le coppie collegate con successo!');
          }
        } else {
          setTimeout(() => {
            matchSelectedLeft = null;
            matchSelectedRight = null;
            renderMatch();
          }, 400);
        }
      }
    }

    // ------------------- NAVIGATION & CONTROLS -------------------
    function switchGame(type) {
      currentGame = type;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      const tabs = ['memory', 'puzzle', 'tile_swap', 'match'];
      const idx = tabs.indexOf(type);
      if (idx >= 0) document.querySelectorAll('.tab-btn')[idx].classList.add('active');

      document.getElementById('memoryContainer').style.display = type === 'memory' ? 'grid' : 'none';
      document.getElementById('puzzleContainer').style.display = type === 'puzzle' ? 'grid' : 'none';
      document.getElementById('tileSwapContainer').style.display = type === 'tile_swap' ? 'grid' : 'none';
      document.getElementById('matchContainer').style.display = type === 'match' ? 'grid' : 'none';

      restartCurrentGame();
    }

    function restartCurrentGame() {
      if (currentGame === 'memory') initMemory();
      else if (currentGame === 'puzzle') initPuzzle();
      else if (currentGame === 'tile_swap') initTileSwap();
      else if (currentGame === 'match') initMatch();
    }

    function peekHint() {
      if (currentGame === 'memory') {
        playAudio('flip');
        document.querySelectorAll('.card').forEach(c => c.classList.add('flipped'));
        setTimeout(() => {
          document.querySelectorAll('.card').forEach(c => {
            if (!c.classList.contains('matched')) c.classList.remove('flipped');
          });
        }, 1200);
      }
    }

    // Boot
    switchGame(currentGame);
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtmlFile(
  deck: Deck,
  puzzleImageUrl: string,
  gameType: ExportGameType = 'all'
) {
  const htmlContent = generateStandaloneHtml(deck, puzzleImageUrl, gameType);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const cleanName = deck.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const filename = `gioco_${cleanName}_autonomo.html`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
