import { MOVES } from "./data";
import {
  applyMoveEffect,
  calculateDamage,
  canMove,
  effectivenessLabel,
  endOfTurnStatus,
  getSpeed,
} from "./engine";
import type { PokemonInstance } from "./types";

export interface TurnAction {
  kind: "move" | "switch";
  moveName?: string;
  switchIndex?: number;
}

export interface BattleSide {
  trainerName: string;
  team: PokemonInstance[];
  activeIndex: number;
}

export interface BattleState {
  player: BattleSide;
  enemy: BattleSide;
  log: string[];
  winner: "player" | "enemy" | null;
}

function active(side: BattleSide): PokemonInstance {
  return side.team[side.activeIndex];
}

function executeMove(
  state: BattleState,
  attackerSide: "player" | "enemy",
  moveName: string,
): void {
  const aSide = attackerSide === "player" ? state.player : state.enemy;
  const dSide = attackerSide === "player" ? state.enemy : state.player;
  const attacker = active(aSide);
  const defender = active(dSide);
  if (attacker.fainted || defender.fainted) return;

  const can = canMove(attacker);
  if (can.log) state.log.push(can.log);
  if (!can.ok) return;

  const moveSlot = attacker.moves.find((m) => m.name === moveName);
  if (!moveSlot || moveSlot.pp <= 0) {
    state.log.push(`${attacker.species} has no PP for ${moveName}!`);
    return;
  }
  moveSlot.pp -= 1;
  const move = MOVES[moveName];
  state.log.push(`${attacker.species} used ${move.name}!`);

  const res = calculateDamage(attacker, defender, move);
  if (res.missed) {
    state.log.push(`${attacker.species}'s attack missed!`);
    return;
  }

  if (move.category !== "status") {
    defender.currentHp = Math.max(0, defender.currentHp - res.damage);
    if (res.critical) state.log.push("A critical hit!");
    const effLabel = effectivenessLabel(res.effectiveness);
    if (effLabel) state.log.push(effLabel);
  }

  const effectLogs = applyMoveEffect(attacker, defender, move);
  state.log.push(...effectLogs);

  if (defender.currentHp <= 0) {
    defender.fainted = true;
    state.log.push(`${defender.species} fainted!`);
  }
}

export function runTurn(
  state: BattleState,
  playerAction: TurnAction,
  enemyAction: TurnAction,
): BattleState {
  // Switches happen before moves
  if (playerAction.kind === "switch" && playerAction.switchIndex !== undefined) {
    state.player.activeIndex = playerAction.switchIndex;
    state.log.push(`Go! ${active(state.player).species}!`);
  }
  if (enemyAction.kind === "switch" && enemyAction.switchIndex !== undefined) {
    state.enemy.activeIndex = enemyAction.switchIndex;
    state.log.push(`Foe sent out ${active(state.enemy).species}!`);
  }

  // Determine move order by priority then speed
  const pMove = playerAction.kind === "move" ? MOVES[playerAction.moveName!] : null;
  const eMove = enemyAction.kind === "move" ? MOVES[enemyAction.moveName!] : null;

  const order: ("player" | "enemy")[] = [];
  if (pMove && eMove) {
    const pp = pMove.priority ?? 0;
    const ep = eMove.priority ?? 0;
    if (pp !== ep) {
      order.push(pp > ep ? "player" : "enemy");
      order.push(pp > ep ? "enemy" : "player");
    } else {
      const ps = getSpeed(active(state.player));
      const es = getSpeed(active(state.enemy));
      if (ps === es) {
        order.push(Math.random() < 0.5 ? "player" : "enemy");
        order.push(order[0] === "player" ? "enemy" : "player");
      } else {
        order.push(ps > es ? "player" : "enemy");
        order.push(ps > es ? "enemy" : "player");
      }
    }
  } else if (pMove) order.push("player");
  else if (eMove) order.push("enemy");

  for (const side of order) {
    const moveName = side === "player" ? playerAction.moveName : enemyAction.moveName;
    if (!moveName) continue;
    executeMove(state, side, moveName);
    if (checkWin(state)) return state;
  }

  // End of turn: status damage
  for (const side of [state.player, state.enemy]) {
    const logs = endOfTurnStatus(active(side));
    state.log.push(...logs);
  }

  checkWin(state);
  return state;
}

function checkWin(state: BattleState): boolean {
  if (state.player.team.every((p) => p.fainted)) {
    state.winner = "enemy";
    state.log.push("You have no more Pokémon! You lost...");
    return true;
  }
  if (state.enemy.team.every((p) => p.fainted)) {
    state.winner = "player";
    state.log.push("You defeated the trainer!");
    return true;
  }
  return false;
}
