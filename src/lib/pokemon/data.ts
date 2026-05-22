import type { Move, Species, Trainer, PokeType } from "./types";

// Type effectiveness chart [attacker][defender]
export const TYPE_CHART: Record<PokeType, Partial<Record<PokeType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const MOVES: Record<string, Move> = {
  Tackle: { name: "Tackle", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 35 },
  "Quick Attack": { name: "Quick Attack", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 30, priority: 1 },
  "Body Slam": { name: "Body Slam", type: "normal", category: "physical", power: 85, accuracy: 100, pp: 15, effect: "paralyze", effectChance: 30 },
  Ember: { name: "Ember", type: "fire", category: "special", power: 40, accuracy: 100, pp: 25, effect: "burn", effectChance: 10 },
  Flamethrower: { name: "Flamethrower", type: "fire", category: "special", power: 90, accuracy: 100, pp: 15, effect: "burn", effectChance: 10 },
  "Fire Blast": { name: "Fire Blast", type: "fire", category: "special", power: 110, accuracy: 85, pp: 5, effect: "burn", effectChance: 30 },
  "Water Gun": { name: "Water Gun", type: "water", category: "special", power: 40, accuracy: 100, pp: 25 },
  Surf: { name: "Surf", type: "water", category: "special", power: 90, accuracy: 100, pp: 15 },
  "Hydro Pump": { name: "Hydro Pump", type: "water", category: "special", power: 110, accuracy: 80, pp: 5 },
  "Vine Whip": { name: "Vine Whip", type: "grass", category: "physical", power: 45, accuracy: 100, pp: 25 },
  "Razor Leaf": { name: "Razor Leaf", type: "grass", category: "physical", power: 55, accuracy: 95, pp: 25 },
  "Solar Beam": { name: "Solar Beam", type: "grass", category: "special", power: 120, accuracy: 100, pp: 10 },
  Thundershock: { name: "Thundershock", type: "electric", category: "special", power: 40, accuracy: 100, pp: 30, effect: "paralyze", effectChance: 10 },
  Thunderbolt: { name: "Thunderbolt", type: "electric", category: "special", power: 90, accuracy: 100, pp: 15, effect: "paralyze", effectChance: 10 },
  Thunder: { name: "Thunder", type: "electric", category: "special", power: 110, accuracy: 70, pp: 10, effect: "paralyze", effectChance: 30 },
  "Ice Beam": { name: "Ice Beam", type: "ice", category: "special", power: 90, accuracy: 100, pp: 10, effect: "freeze", effectChance: 10 },
  Psychic: { name: "Psychic", type: "psychic", category: "special", power: 90, accuracy: 100, pp: 10 },
  Confusion: { name: "Confusion", type: "psychic", category: "special", power: 50, accuracy: 100, pp: 25 },
  "Shadow Ball": { name: "Shadow Ball", type: "ghost", category: "special", power: 80, accuracy: 100, pp: 15 },
  "Dragon Claw": { name: "Dragon Claw", type: "dragon", category: "physical", power: 80, accuracy: 100, pp: 15 },
  Earthquake: { name: "Earthquake", type: "ground", category: "physical", power: 100, accuracy: 100, pp: 10 },
  "Rock Slide": { name: "Rock Slide", type: "rock", category: "physical", power: 75, accuracy: 90, pp: 10 },
  "Iron Tail": { name: "Iron Tail", type: "steel", category: "physical", power: 100, accuracy: 75, pp: 15 },
  Crunch: { name: "Crunch", type: "dark", category: "physical", power: 80, accuracy: 100, pp: 15 },
  "Air Slash": { name: "Air Slash", type: "flying", category: "special", power: 75, accuracy: 95, pp: 15 },
  "Sludge Bomb": { name: "Sludge Bomb", type: "poison", category: "special", power: 90, accuracy: 100, pp: 10, effect: "poison", effectChance: 30 },
  "Close Combat": { name: "Close Combat", type: "fighting", category: "physical", power: 120, accuracy: 100, pp: 5 },
  Recover: { name: "Recover", type: "normal", category: "status", power: 0, accuracy: 100, pp: 10, effect: "heal" },
  Growl: { name: "Growl", type: "normal", category: "status", power: 0, accuracy: 100, pp: 40 },
};

export const SPECIES: Record<string, Species> = {
  Charizard: { name: "Charizard", types: ["fire", "flying"], base: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }, moves: ["Flamethrower", "Air Slash", "Dragon Claw", "Fire Blast"], sprite: "🔥🐉", color: "#ef4444" },
  Blastoise: { name: "Blastoise", types: ["water"], base: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 }, moves: ["Hydro Pump", "Surf", "Ice Beam", "Body Slam"], sprite: "💧🐢", color: "#3b82f6" },
  Venusaur: { name: "Venusaur", types: ["grass", "poison"], base: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 }, moves: ["Solar Beam", "Sludge Bomb", "Razor Leaf", "Earthquake"], sprite: "🌿🦖", color: "#22c55e" },
  Pikachu: { name: "Pikachu", types: ["electric"], base: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, moves: ["Thunderbolt", "Quick Attack", "Iron Tail", "Thunder"], sprite: "⚡🐭", color: "#eab308" },
  Gengar: { name: "Gengar", types: ["ghost", "poison"], base: { hp: 60, atk: 65, def: 60, spa: 130, spd: 75, spe: 110 }, moves: ["Shadow Ball", "Sludge Bomb", "Psychic", "Thunderbolt"], sprite: "👻", color: "#7c3aed" },
  Alakazam: { name: "Alakazam", types: ["psychic"], base: { hp: 55, atk: 50, def: 45, spa: 135, spd: 95, spe: 120 }, moves: ["Psychic", "Shadow Ball", "Recover", "Confusion"], sprite: "🥄🧙", color: "#f59e0b" },
  Machamp: { name: "Machamp", types: ["fighting"], base: { hp: 90, atk: 130, def: 80, spa: 65, spd: 85, spe: 55 }, moves: ["Close Combat", "Rock Slide", "Earthquake", "Body Slam"], sprite: "💪", color: "#a16207" },
  Snorlax: { name: "Snorlax", types: ["normal"], base: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 }, moves: ["Body Slam", "Earthquake", "Crunch", "Rock Slide"], sprite: "😴🐻", color: "#64748b" },
  Dragonite: { name: "Dragonite", types: ["dragon", "flying"], base: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 }, moves: ["Dragon Claw", "Thunder", "Fire Blast", "Air Slash"], sprite: "🐲", color: "#f97316" },
  Lapras: { name: "Lapras", types: ["water", "ice"], base: { hp: 130, atk: 85, def: 80, spa: 85, spd: 95, spe: 60 }, moves: ["Ice Beam", "Surf", "Body Slam", "Thunderbolt"], sprite: "🦕💧", color: "#0ea5e9" },
};

export const TRAINERS: Trainer[] = [
  {
    name: "Youngster Joey",
    title: "Bug Catcher",
    sprite: "🧒",
    strategy: "random",
    team: [
      { species: "Pikachu", level: 25, moves: ["Thundershock", "Quick Attack", "Iron Tail", "Thunderbolt"] },
      { species: "Snorlax", level: 25, moves: ["Tackle", "Body Slam", "Crunch", "Rock Slide"] },
    ],
  },
  {
    name: "Lt. Surge",
    title: "Gym Leader",
    sprite: "⚡👨",
    strategy: "aggressive",
    team: [
      { species: "Pikachu", level: 40, moves: ["Thunderbolt", "Iron Tail", "Quick Attack", "Thunder"] },
      { species: "Lapras", level: 40, moves: ["Thunderbolt", "Ice Beam", "Surf", "Body Slam"] },
      { species: "Machamp", level: 42, moves: ["Close Combat", "Earthquake", "Rock Slide", "Body Slam"] },
    ],
  },
  {
    name: "Champion Lance",
    title: "Pokémon Master",
    sprite: "👑🐉",
    strategy: "smart",
    team: [
      { species: "Dragonite", level: 60, moves: ["Dragon Claw", "Thunder", "Fire Blast", "Air Slash"] },
      { species: "Charizard", level: 58, moves: ["Flamethrower", "Air Slash", "Dragon Claw", "Fire Blast"] },
      { species: "Gengar", level: 58, moves: ["Shadow Ball", "Sludge Bomb", "Psychic", "Thunderbolt"] },
      { species: "Alakazam", level: 60, moves: ["Psychic", "Shadow Ball", "Recover", "Confusion"] },
    ],
  },
];

export const PLAYER_TEAM_OPTIONS = ["Charizard", "Blastoise", "Venusaur", "Pikachu", "Gengar", "Alakazam", "Machamp", "Snorlax", "Dragonite", "Lapras"];
