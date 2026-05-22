import { MOVES, SPECIES, TYPE_CHART } from "./data";
import type { BaseStats, Move, PokeType, PokemonInstance } from "./types";

export function computeStats(speciesName: string, level: number): BaseStats {
  const base = SPECIES[speciesName].base;
  // Simplified Gen 3+ stat formula with no IV/EV
  const calc = (b: number) => Math.floor(((2 * b) * level) / 100) + 5;
  const hp = Math.floor(((2 * base.hp) * level) / 100) + level + 10;
  return {
    hp,
    atk: calc(base.atk),
    def: calc(base.def),
    spa: calc(base.spa),
    spd: calc(base.spd),
    spe: calc(base.spe),
  };
}

export function createPokemon(species: string, level: number, moves: string[]): PokemonInstance {
  const stats = computeStats(species, level);
  return {
    species,
    baseSpecies: species,
    level,
    stats,
    currentHp: stats.hp,
    moves: moves.map((m) => ({ name: m, pp: MOVES[m].pp, maxPp: MOVES[m].pp })),
    status: null,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    fainted: false,
    isMega: false,
  };
}

export function megaEvolve(p: PokemonInstance): boolean {
  const base = SPECIES[p.baseSpecies];
  if (!base?.megaForm || p.isMega || p.fainted) return false;
  const megaName = base.megaForm;
  if (!SPECIES[megaName]) return false;
  const newStats = computeStats(megaName, p.level);
  const hpRatio = p.currentHp / p.stats.hp;
  p.species = megaName;
  p.stats = newStats;
  p.currentHp = Math.max(1, Math.floor(newStats.hp * hpRatio));
  p.isMega = true;
  return true;
}

export function typeEffectiveness(moveType: PokeType, defenderTypes: PokeType[]): number {
  let mult = 1;
  for (const dt of defenderTypes) {
    const v = TYPE_CHART[moveType]?.[dt];
    if (v !== undefined) mult *= v;
  }
  return mult;
}

function stageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  critical: boolean;
  missed: boolean;
  stab: boolean;
}

export function calculateDamage(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  move: Move,
  rng: () => number = Math.random,
): DamageResult {
  if (move.category === "status") {
    return { damage: 0, effectiveness: 1, critical: false, missed: false, stab: false };
  }

  // Accuracy
  const accRoll = rng() * 100;
  if (accRoll > move.accuracy) {
    return { damage: 0, effectiveness: 1, critical: false, missed: true, stab: false };
  }

  const atkSpecies = SPECIES[attacker.species];
  const defSpecies = SPECIES[defender.species];

  const isPhys = move.category === "physical";
  const atkStat = isPhys ? attacker.stats.atk : attacker.stats.spa;
  const defStat = isPhys ? defender.stats.def : defender.stats.spd;
  const atkStage = isPhys ? attacker.stages.atk : attacker.stages.spa;
  const defStage = isPhys ? defender.stages.def : defender.stages.spd;

  let A = atkStat * stageMultiplier(atkStage);
  const D = defStat * stageMultiplier(defStage);

  // Burn halves physical attack
  if (isPhys && attacker.status === "burn") A *= 0.5;

  const level = attacker.level;
  const base = ((2 * level) / 5 + 2) * move.power * (A / D);
  let dmg = Math.floor(base / 50) + 2;

  // STAB
  const stab = atkSpecies.types.includes(move.type);
  if (stab) dmg = Math.floor(dmg * 1.5);

  // Type effectiveness
  const eff = typeEffectiveness(move.type, defSpecies.types);
  dmg = Math.floor(dmg * eff);

  // Critical hit (1/24)
  const critical = rng() < 1 / 24;
  if (critical) dmg = Math.floor(dmg * 1.5);

  // Random factor 0.85 - 1.0
  dmg = Math.floor(dmg * (0.85 + rng() * 0.15));

  return { damage: Math.max(eff === 0 ? 0 : 1, dmg), effectiveness: eff, critical, missed: false, stab };
}

export function applyMoveEffect(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  move: Move,
  rng: () => number = Math.random,
): string[] {
  const logs: string[] = [];
  if (move.effect && (move.effectChance ?? 100) >= rng() * 100) {
    switch (move.effect) {
      case "heal": {
        const heal = Math.floor(attacker.stats.hp / 2);
        const before = attacker.currentHp;
        attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + heal);
        logs.push(`${attacker.species} recovered ${attacker.currentHp - before} HP!`);
        break;
      }
      case "burn":
        if (!defender.status && !SPECIES[defender.species].types.includes("fire")) {
          defender.status = "burn";
          logs.push(`${defender.species} was burned!`);
        }
        break;
      case "paralyze":
        if (!defender.status && !SPECIES[defender.species].types.includes("electric")) {
          defender.status = "paralyze";
          logs.push(`${defender.species} is paralyzed!`);
        }
        break;
      case "poison":
        if (!defender.status && !SPECIES[defender.species].types.some((t) => t === "poison" || t === "steel")) {
          defender.status = "poison";
          logs.push(`${defender.species} was poisoned!`);
        }
        break;
      case "freeze":
        if (!defender.status && !SPECIES[defender.species].types.includes("ice")) {
          defender.status = "freeze";
          logs.push(`${defender.species} was frozen solid!`);
        }
        break;
    }
  }
  return logs;
}

export function endOfTurnStatus(p: PokemonInstance): string[] {
  const logs: string[] = [];
  if (p.fainted) return logs;
  if (p.status === "burn") {
    const dmg = Math.max(1, Math.floor(p.stats.hp / 16));
    p.currentHp = Math.max(0, p.currentHp - dmg);
    logs.push(`${p.species} is hurt by its burn! (-${dmg})`);
  } else if (p.status === "poison") {
    const dmg = Math.max(1, Math.floor(p.stats.hp / 8));
    p.currentHp = Math.max(0, p.currentHp - dmg);
    logs.push(`${p.species} is hurt by poison! (-${dmg})`);
  }
  if (p.currentHp <= 0) {
    p.fainted = true;
    logs.push(`${p.species} fainted!`);
  }
  return logs;
}

export function canMove(p: PokemonInstance, rng: () => number = Math.random): { ok: boolean; log?: string } {
  if (p.status === "freeze") {
    if (rng() < 0.2) {
      p.status = null;
      return { ok: true, log: `${p.species} thawed out!` };
    }
    return { ok: false, log: `${p.species} is frozen solid!` };
  }
  if (p.status === "paralyze" && rng() < 0.25) {
    return { ok: false, log: `${p.species} is paralyzed and can't move!` };
  }
  if (p.status === "sleep") {
    return { ok: false, log: `${p.species} is fast asleep!` };
  }
  return { ok: true };
}

export function effectivenessLabel(e: number): string {
  if (e === 0) return "It had no effect...";
  if (e >= 2) return "It's super effective!";
  if (e <= 0.5) return "It's not very effective...";
  return "";
}

export function getSpeed(p: PokemonInstance): number {
  let s = p.stats.spe * stageMultiplier(p.stages.spe);
  if (p.status === "paralyze") s *= 0.5;
  return s;
}
