export type PokeType =
  | "normal" | "fire" | "water" | "grass" | "electric" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

export type MoveCategory = "physical" | "special" | "status";

export interface Move {
  name: string;
  type: PokeType;
  category: MoveCategory;
  power: number; // 0 for status
  accuracy: number; // 0-100
  pp: number;
  effect?: "burn" | "paralyze" | "poison" | "freeze" | "sleep" | "heal" | "atk+" | "def+" | "spd+";
  effectChance?: number; // 0-100
  priority?: number;
}

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface Species {
  name: string;
  types: PokeType[];
  base: BaseStats;
  moves: string[]; // move names available
  sprite: string; // emoji fallback
  color: string; // accent color hex
  region?: "Kanto" | "Johto" | "Hoenn" | "Sinnoh" | "Unova" | "Kalos";
  megaForm?: string; // key into SPECIES for the Mega form
  image?: string; // override sprite URL
  legendary?: boolean;
}

export interface PokemonInstance {
  species: string;
  baseSpecies: string; // species before mega evolution
  level: number;
  stats: BaseStats; // computed
  currentHp: number;
  moves: { name: string; pp: number; maxPp: number }[];
  status?: "burn" | "paralyze" | "poison" | "freeze" | "sleep" | null;
  stages: { atk: number; def: number; spa: number; spd: number; spe: number; acc: number; eva: number };
  fainted: boolean;
  isMega: boolean;
}

export interface Trainer {
  name: string;
  title: string;
  sprite: string;
  team: { species: string; level: number; moves: string[] }[];
  strategy: "random" | "smart" | "aggressive";
}
