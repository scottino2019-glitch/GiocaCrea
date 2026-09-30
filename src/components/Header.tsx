import { Volume2, VolumeX, Sparkles, FileCode } from 'lucide-react';
import { ActiveGameTab } from '../types/game';
import { playSound } from '../utils/sound';

interface HeaderProps {
  activeTab: ActiveGameTab;
  onTabChange: (tab: ActiveGameTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenExportHtml: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  isMuted,
  onToggleMute,
  onOpenExportHtml,
}: HeaderProps) {
  const tabs: { id: ActiveGameTab; label: string }[] = [
    { id: 'memory', label: 'Memory Game' },
    { id: 'sliding_puzzle', label: 'Puzzle Scivolo' },
    { id: 'tile_puzzle', label: 'Puzzle Tessere' },
    { id: 'match_pairs', label: 'Collega Coppie' },
    { id: 'deck_builder', label: 'Crea Mazzi' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={() => onTabChange('memory')}
            className="text-left group cursor-pointer"
          >
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              GiocaCrea
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links / Segmented Control */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-x-auto scrollbar-none max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('click');
                  onTabChange(tab.id);
                }}
                className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('click');
              onOpenExportHtml();
            }}
            title="Esporta il gioco in un singolo file HTML autonomo"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Esporta Gioco HTML</span>
            <span className="sm:hidden">Esporta</span>
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Attiva audio' : 'Disattiva audio'}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Attiva o disattiva audio"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

