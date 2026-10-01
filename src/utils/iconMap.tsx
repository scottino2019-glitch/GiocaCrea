import React from 'react';
import {
  Sparkles,
  Rocket,
  Compass,
  Trophy,
  Heart,
  Star,
  Sun,
  Moon,
  Cloud,
  Zap,
  Flame,
  Droplet,
  Globe,
  Music,
  Camera,
  Coffee,
  Pizza,
  Apple,
  Fish,
  Cat,
  Dog,
  Bird,
  Trees,
  Flower2,
  Car,
  Plane,
  Bike,
  Ship,
  Shield,
  Sword,
  Crown,
  Key,
  Book,
  PenTool,
  Palette,
  Smile,
  Anchor,
  Clock,
  Gift,
  Bell,
  CheckCircle,
  Flag,
  Target,
  Dice5,
  Gamepad2,
  Puzzle,
  Lightbulb,
  Gem,
  Ghost,
  Footprints,
  Feather,
  Umbrella,
  Compass as CompassIcon,
  Headphones,
  Glasses,
  Watch,
  Award,
  CircleDot,
  Hexagon,
  Triangle,
  Square,
  type LucideIcon,
} from 'lucide-react';

export const ICON_LIBRARY: Record<string, { label: string; icon: LucideIcon; category: string }> = {
  // Animali & Natura
  Cat: { label: 'Gatto', icon: Cat, category: 'Natura' },
  Dog: { label: 'Cane', icon: Dog, category: 'Natura' },
  Bird: { label: 'Uccellino', icon: Bird, category: 'Natura' },
  Fish: { label: 'Pesciolino', icon: Fish, category: 'Natura' },
  Trees: { label: 'Alberi', icon: Trees, category: 'Natura' },
  Flower2: { label: 'Fiore', icon: Flower2, category: 'Natura' },
  Sun: { label: 'Sole', icon: Sun, category: 'Natura' },
  Moon: { label: 'Luna', icon: Moon, category: 'Natura' },
  Cloud: { label: 'Nuvola', icon: Cloud, category: 'Natura' },
  Flame: { label: 'Fuoco', icon: Flame, category: 'Natura' },
  Droplet: { label: 'Goccia', icon: Droplet, category: 'Natura' },
  Feather: { label: 'Piuma', icon: Feather, category: 'Natura' },
  Footprints: { label: 'Impronte', icon: Footprints, category: 'Natura' },

  // Spazio & Avventura
  Rocket: { label: 'Razzo', icon: Rocket, category: 'Avventura' },
  Star: { label: 'Stella', icon: Star, category: 'Avventura' },
  Globe: { label: 'Pianeta', icon: Globe, category: 'Avventura' },
  Compass: { label: 'Bussola', icon: Compass, category: 'Avventura' },
  Anchor: { label: 'Ancora', icon: Anchor, category: 'Avventura' },
  Plane: { label: 'Aereo', icon: Plane, category: 'Avventura' },
  Car: { label: 'Automobile', icon: Car, category: 'Avventura' },
  Bike: { label: 'Bicicletta', icon: Bike, category: 'Avventura' },
  Ship: { label: 'Nave', icon: Ship, category: 'Avventura' },

  // Fantasia & Magia
  Crown: { label: 'Corona Reale', icon: Crown, category: 'Fantasia' },
  Sword: { label: 'Spada', icon: Sword, category: 'Fantasia' },
  Shield: { label: 'Scudo', icon: Shield, category: 'Fantasia' },
  Gem: { label: 'Gemma', icon: Gem, category: 'Fantasia' },
  Key: { label: 'Chiave Dorata', icon: Key, category: 'Fantasia' },
  Ghost: { label: 'Fantasmino', icon: Ghost, category: 'Fantasia' },
  Sparkles: { label: 'Magia', icon: Sparkles, category: 'Fantasia' },

  // Cibo & Dolci
  Apple: { label: 'Mela', icon: Apple, category: 'Cibo' },
  Pizza: { label: 'Pizza', icon: Pizza, category: 'Cibo' },
  Coffee: { label: 'Caffè', icon: Coffee, category: 'Cibo' },

  // Giochi & Svago
  Gamepad2: { label: 'Videogioco', icon: Gamepad2, category: 'Giochi' },
  Dice5: { label: 'Dado', icon: Dice5, category: 'Giochi' },
  Puzzle: { label: 'Tessera Puzzle', icon: Puzzle, category: 'Giochi' },
  Trophy: { label: 'Trofeo', icon: Trophy, category: 'Giochi' },
  Award: { label: 'Medaglia', icon: Award, category: 'Giochi' },
  Target: { label: 'Bersaglio', icon: Target, category: 'Giochi' },
  Music: { label: 'Nota Musicale', icon: Music, category: 'Giochi' },
  Headphones: { label: 'Cuffie', icon: Headphones, category: 'Giochi' },
  Camera: { label: 'Fotocamera', icon: Camera, category: 'Giochi' },
  Palette: { label: 'Tavolozza Colori', icon: Palette, category: 'Giochi' },
  Gift: { label: 'Regalo', icon: Gift, category: 'Giochi' },
  Heart: { label: 'Cuore', icon: Heart, category: 'Giochi' },
  Bell: { label: 'Campana', icon: Bell, category: 'Giochi' },
  Lightbulb: { label: 'Lampadina Idea', icon: Lightbulb, category: 'Giochi' },

  // Forme
  CircleDot: { label: 'Cerchio', icon: CircleDot, category: 'Forme' },
  Triangle: { label: 'Triangolo', icon: Triangle, category: 'Forme' },
  Square: { label: 'Quadrato', icon: Square, category: 'Forme' },
  Hexagon: { label: 'Esagono', icon: Hexagon, category: 'Forme' },
};

export const COLOR_PALETTE = [
  { name: 'Ambra', value: 'from-amber-500/20 to-amber-600/30 text-amber-300 border-amber-500/40' },
  { name: 'Smeraldo', value: 'from-emerald-500/20 to-emerald-600/30 text-emerald-300 border-emerald-500/40' },
  { name: 'Ciano', value: 'from-cyan-500/20 to-cyan-600/30 text-cyan-300 border-cyan-500/40' },
  { name: 'Indaco', value: 'from-indigo-500/20 to-indigo-600/30 text-indigo-300 border-indigo-500/40' },
  { name: 'Rosa', value: 'from-rose-500/20 to-rose-600/30 text-rose-300 border-rose-500/40' },
  { name: 'Viola', value: 'from-purple-500/20 to-purple-600/30 text-purple-300 border-purple-500/40' },
  { name: 'Arancio', value: 'from-orange-500/20 to-orange-600/30 text-orange-300 border-orange-500/40' },
  { name: 'Blu Reale', value: 'from-blue-500/20 to-blue-600/30 text-blue-300 border-blue-500/40' },
];

export function DynamicIcon({
  name,
  className = 'w-8 h-8',
}: {
  name?: string;
  className?: string;
}) {
  if (!name || !name.trim()) {
    return <Sparkles className={`${className} opacity-25`} />;
  }
  const entry = ICON_LIBRARY[name];
  if (entry) {
    const IconComponent = entry.icon;
    return <IconComponent className={className} />;
  }

  // Support direct keyboard-typed emoji, character, or symbol!
  return (
    <span
      className={`inline-flex items-center justify-center font-bold select-none leading-none ${className}`}
      style={{ fontSize: '1.35em' }}
    >
      {name}
    </span>
  );
}
