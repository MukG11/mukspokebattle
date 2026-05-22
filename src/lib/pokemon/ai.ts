import { MOVES, SPECIES } from "./data";
import { calculateDamage, typeEffectiveness } from "./engine";
import type { PokemonInstance, Trainer } from "./types";

/**
 * AI decision: pick which move to use.
 * - random: pick any move with PP
 * - aggressive: pick move with highest expected damage
 * - smart: factor in type effectiveness, STAB, and finishing blows
 */
export function chooseAiMove(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  strategy: Trainer["strategy"],
): string {
  const usable = attacker.moves.filter((m) => m.pp > 0);
  if (usable.length === 0) return "Struggle";

  if (strategy === "random") {
    return usable[Math.floor(Math.random() * usable.length)].name;
  }

  const scored = usable.map((m) => {
    const move = MOVES[m.name];
    let score = 0;
    if (move.category === "status") {
      score = move.effect === "heal" && attacker.currentHp < attacker.stats.hp * 0.4 ? 80 : 10;
    } else {
      // Estimate damage with fixed rng (avg roll)
      const est = calculateDamage(attacker, defender, move, () => 0.925);
      score = est.damage;
      const eff = typeEffectiveness(move.type, SPECIES[defender.species].types);
      if (strategy === "smart") {
        score *= 1 + (eff - 1) * 0.5;
        // Bonus for finishing blow
        if (est.damage >= defender.currentHp) score *= 1.5;
        // Penalty low accuracy
        score *= move.accuracy / 100;
      }
    }
    return { name: m.name, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (strategy === "smart") {
    // Top 1
    return scored[0].name;
  }
  // aggressive: weighted random from top 2
  const top = scored.slice(0, 2);
  const total = top.reduce((s, x) => s + Math.max(1, x.score), 0);
  let r = Math.random() * total;
  for (const t of top) {
    r -= Math.max(1, t.score);
    if (r <= 0) return t.name;
  }
  return scored[0].name;
}

export function chooseAiSwitch(team: PokemonInstance[], defender: PokemonInstance): number {
  // Pick next non-fainted with best matchup vs defender
  let best = -1;
  let bestScore = -Infinity;
  team.forEach((p, i) => {
    if (p.fainted) return;
    let score = 0;
    for (const m of p.moves) {
      const move = MOVES[m.name];
      if (move.category === "status") continue;
      const eff = typeEffectiveness(move.type, SPECIES[defender.species].types);
      score = Math.max(score, eff);
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
