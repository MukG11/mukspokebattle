import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MOVES, PLAYER_TEAM_OPTIONS, SPECIES, TRAINERS, getSpriteUrl } from "@/lib/pokemon/data";
import { createPokemon } from "@/lib/pokemon/engine";
import { chooseAiMove, chooseAiSwitch } from "@/lib/pokemon/ai";
import {
  type BattleState,
  type TurnAction,
  runTurn,
} from "@/lib/pokemon/battle";
import type { PokemonInstance } from "@/lib/pokemon/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MAX_LEVEL,
  addLevels,
  addXp,
  getProgress,
  resetProgress,
  xpToNext,
} from "@/lib/pokemon/progression";

export const Route = createFileRoute("/")({ component: BattlePage });

interface XpReportEntry {
  name: string;
  levelBefore: number;
  levelAfter: number;
  xpGained: number;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-gray-400", fire: "bg-red-500", water: "bg-blue-500", grass: "bg-green-500",
  electric: "bg-yellow-400 text-black", ice: "bg-cyan-300 text-black", fighting: "bg-orange-700",
  poison: "bg-purple-600", ground: "bg-amber-600", flying: "bg-sky-400", psychic: "bg-pink-500",
  bug: "bg-lime-600", rock: "bg-yellow-700", ghost: "bg-indigo-700", dragon: "bg-violet-700",
  dark: "bg-neutral-800", steel: "bg-slate-400 text-black", fairy: "bg-pink-300 text-black",
};

function buildPlayerTeam(picks: string[]): PokemonInstance[] {
  return picks.map((name) => {
    const sp = SPECIES[name];
    const { level } = getProgress(name);
    return createPokemon(name, level, sp.moves);
  });
}

function buildEnemyTeam(trainerIdx: number): PokemonInstance[] {
  return TRAINERS[trainerIdx].team.map((m) => createPokemon(m.species, m.level, m.moves));
}

function PokeSprite({ name, className = "w-12 h-12" }: { name: string; className?: string }) {
  const sp = SPECIES[name];
  const [failed, setFailed] = useState(false);
  if (failed || !sp) return <span className="text-3xl">{sp?.sprite ?? "❓"}</span>;
  return (
    <img
      src={getSpriteUrl(name)}
      alt={name}
      className={`${className} object-contain pixelated`}
      style={{ imageRendering: "pixelated" }}
      onError={() => setFailed(true)}
    />
  );
}

function HpBar({ p }: { p: PokemonInstance }) {
  const pct = (p.currentHp / p.stats.hp) * 100;
  const color = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span>HP</span>
        <span>{p.currentHp} / {p.stats.hp}</span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PokemonCard({ p, side }: { p: PokemonInstance; side: "player" | "enemy" }) {
  const sp = SPECIES[p.species];
  return (
    <Card className="p-4 flex-1 min-w-[280px]" style={{ borderColor: sp.color, borderWidth: 2 }}>
      <div className="flex items-center gap-3 mb-2">
        <PokeSprite name={p.species} className="w-20 h-20" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{sp.name}</h3>
            <span className="text-xs text-muted-foreground">Lv. {p.level}</span>
            {p.isMega && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-600 text-white font-bold">MEGA</span>}
          </div>
          <div className="flex gap-1 mt-1">
            {sp.types.map((t) => (
              <span key={t} className={`text-[10px] px-2 py-0.5 rounded uppercase text-white font-bold ${TYPE_COLORS[t]}`}>
                {t}
              </span>
            ))}
            {p.status && (
              <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-purple-200 text-purple-900">
                {p.status}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground uppercase">{side}</div>
      </div>
      <HpBar p={p} />
    </Card>
  );
}

function TeamPicker({ onStart }: { onStart: (picks: string[], trainerIdx: number) => void }) {
  const [picks, setPicks] = useState<string[]>([]);
  const [trainerIdx, setTrainerIdx] = useState(0);
  const [progressTick, setProgressTick] = useState(0);
  const bump = () => setProgressTick((n) => n + 1);

  const toggle = (name: string) => {
    setPicks((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : prev.length < 6 ? [...prev, name] : prev,
    );
  };

  const trainOne = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    addLevels(name, 1);
    bump();
  };

  const resetAll = () => {
    if (typeof window !== "undefined" && window.confirm("Reset all Pokémon levels back to 50?")) {
      resetProgress();
      bump();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-3">
        <h1
          className="text-5xl font-black tracking-tight"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #ef4444 50%, #c084fc 75%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 8px rgba(251,191,36,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
          }}
        >
          ⚔️ Pokémon Battle Engine
        </h1>
        <p className="text-sm text-white/60">
          Pick up to 6 Pokémon. Mega Evolutions enabled. Pokémon gain XP and level up after battles — train them up to Lv. {MAX_LEVEL}.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Your Team ({picks.length}/6)</h2>
          <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs">Reset Levels</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[480px] overflow-y-auto pr-2">
          {PLAYER_TEAM_OPTIONS.map((name) => {
            const sp = SPECIES[name];
            const selected = picks.includes(name);
            const prog = getProgress(name);
            void progressTick; // re-read after train
            const xpPct = prog.level >= MAX_LEVEL ? 100 : Math.min(100, (prog.xp / xpToNext(prog.level)) * 100);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
                style={selected ? { borderColor: sp.color } : undefined}
              >
                <div className="flex items-center justify-between">
                  <PokeSprite name={name} className="w-12 h-12" />
                  <div className="flex flex-col gap-0.5 items-end">
                    {sp.legendary && <span className="text-[8px] px-1 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold">LEGEND</span>}
                    {sp.megaForm && <span className="text-[8px] px-1 py-0.5 rounded bg-fuchsia-600 text-white font-bold">MEGA</span>}
                  </div>
                </div>
                <div className="text-sm font-bold leading-tight">{name}</div>
                <div className="flex items-center justify-between mt-0.5">
                  {sp.region && <div className="text-[9px] text-muted-foreground">{sp.region}</div>}
                  <div className="text-[10px] font-mono font-bold text-amber-400">Lv. {prog.level}</div>
                </div>
                <div className="h-1 rounded bg-muted/40 overflow-hidden mt-1">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${xpPct}%` }} />
                </div>
                <div className="flex gap-1 mt-1 flex-wrap items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {sp.types.map((t) => (
                      <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded uppercase text-white font-bold ${TYPE_COLORS[t]}`}>{t}</span>
                    ))}
                  </div>
                  <span
                    role="button"
                    onClick={(e) => trainOne(e, name)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    title="Train +1 level"
                  >
                    +Lv
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold mb-3">Opponent</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          {TRAINERS.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setTrainerIdx(i)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                trainerIdx === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-4xl">{t.sprite}</div>
              <div className="font-bold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.title}</div>
              <div className="text-xs mt-2">
                <Badge variant="secondary" className="capitalize">{t.strategy} AI</Badge>
              </div>
              <div className="text-xs mt-2 text-muted-foreground">
                {t.team.length} Pokémon · Lv. {t.team[0].level}+
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" disabled={picks.length === 0} onClick={() => onStart(picks, trainerIdx)}>
          Start Battle
        </Button>
      </div>
    </div>
  );
}

interface MoveAnim {
  id: number;
  attacker: "player" | "enemy";
  moveName: string;
  type: string;
}

function Battle({ state, onAction, onReset, xpReport, anim, busy }: {
  state: BattleState;
  onAction: (a: TurnAction) => void;
  onReset: () => void;
  xpReport: XpReportEntry[];
  anim: MoveAnim | null;
  busy: boolean;
}) {
  const player = state.player.team[state.player.activeIndex];
  const enemy = state.enemy.team[state.enemy.activeIndex];
  const [showSwitch, setShowSwitch] = useState(false);
  const [megaArmed, setMegaArmed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [state.log.length]);

  const mustSwitch = player.fainted && !state.winner;
  const canMega = !state.player.megaUsed && !player.isMega && !!SPECIES[player.baseSpecies]?.megaForm;

  const playerAttacking = anim?.attacker === "player";
  const enemyAttacking = anim?.attacker === "enemy";
  const projectileColor = anim ? (TYPE_COLORS[anim.type] ?? "bg-white") : "";

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚔️ Battle vs {state.enemy.trainerName}</h1>
        <Button variant="outline" size="sm" onClick={onReset}>Forfeit</Button>
      </div>

      {/* Battlefield */}
      <div className="relative rounded-xl overflow-hidden min-h-[320px] border border-white/10">
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-amber-950" />
        {/* Stars / distant lights */}
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {/* Stadium lights glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full blur-3xl opacity-20 bg-cyan-400" />
        {/* Ground / Arena floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-stone-800 via-stone-700 to-stone-600" />
        {/* Arena floor lines */}
        <div className="absolute bottom-[38%] left-[10%] right-[10%] h-px bg-amber-400/40" />
        <div className="absolute bottom-[42%] left-[20%] right-[20%] h-px bg-amber-400/20" />
        {/* Battle circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-amber-400/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-amber-400/20" />
        {/* VS Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-white/20">
            <span className="text-lg font-black text-white italic">VS</span>
          </div>
        </div>

        {/* Move projectile flying across the field */}
        {anim && (
          <div
            key={`proj-${anim.id}`}
            className={`absolute top-1/2 left-1/2 w-10 h-10 -ml-5 -mt-5 rounded-full ${projectileColor} blur-md shadow-2xl z-20 pointer-events-none ${
              anim.attacker === "player" ? "anim-projectile-enemy" : "anim-projectile-player"
            }`}
          />
        )}

        {/* Move name banner */}
        {anim && (
          <div
            key={`banner-${anim.id}`}
            className="absolute top-3 left-1/2 z-30 anim-banner pointer-events-none"
          >
            <div className={`px-4 py-1.5 rounded-full ${projectileColor} text-white font-black text-sm tracking-wider shadow-lg border border-white/30 whitespace-nowrap`}>
              {anim.moveName.toUpperCase()}
            </div>
          </div>
        )}

        {/* Pokémon Cards positioned on battlefield */}
        <div
          key={`enemy-${state.enemy.activeIndex}-${anim?.id ?? "idle"}`}
          className={`absolute top-4 right-4 max-w-[260px] w-full z-10 ${
            enemyAttacking ? "anim-attack-enemy" : playerAttacking ? "anim-hit" : ""
          }`}
        >
          <PokemonCard p={enemy} side="enemy" />
        </div>
        <div
          key={`player-${state.player.activeIndex}-${anim?.id ?? "idle"}`}
          className={`absolute bottom-4 left-4 max-w-[260px] w-full z-10 ${
            playerAttacking ? "anim-attack-player" : enemyAttacking ? "anim-hit" : ""
          }`}
        >
          <PokemonCard p={player} side="player" />
        </div>
      </div>

      {/* Battle log */}
      <Card className="p-3">
        <div ref={logRef} className="h-32 overflow-y-auto font-mono text-sm space-y-1">
          {state.log.length === 0 && <div className="text-muted-foreground">Choose your move...</div>}
          {state.log.map((l, i) => <div key={i}>› {l}</div>)}
        </div>
      </Card>

      {/* Controls */}
      {state.winner ? (
        <Card className="p-6 text-center space-y-3">
          <div className="text-3xl font-bold">
            {state.winner === "player" ? "🏆 Victory!" : "💀 Defeat"}
          </div>
          {state.winner === "player" && xpReport.length > 0 && (
            <div className="text-left max-w-md mx-auto space-y-1 bg-muted/30 rounded p-3">
              <div className="text-xs font-bold uppercase text-amber-400 mb-1">Experience Gained</div>
              {xpReport.map((r) => {
                const leveled = r.levelAfter > r.levelBefore;
                return (
                  <div key={r.name} className="flex justify-between text-sm font-mono">
                    <span>{r.name}</span>
                    <span className={leveled ? "text-emerald-400 font-bold" : "text-white/70"}>
                      +{r.xpGained} XP{leveled ? ` · Lv.${r.levelBefore} → Lv.${r.levelAfter}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <Button onClick={onReset}>Battle Again</Button>
        </Card>
      ) : mustSwitch ? (
        <Card className="p-4">
          <div className="font-bold mb-2">Choose your next Pokémon:</div>
          <SwitchPanel team={state.player.team} activeIndex={state.player.activeIndex} forced onPick={(i) => onAction({ kind: "switch", switchIndex: i })} />
        </Card>
      ) : showSwitch ? (
        <Card className="p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-bold">Switch Pokémon</div>
            <Button variant="ghost" size="sm" onClick={() => setShowSwitch(false)}>Cancel</Button>
          </div>
          <SwitchPanel team={state.player.team} activeIndex={state.player.activeIndex} onPick={(i) => { setShowSwitch(false); onAction({ kind: "switch", switchIndex: i }); }} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="text-sm font-bold mb-2">Moves</div>
            <div className="grid grid-cols-2 gap-2">
              {player.moves.map((m) => {
                const mv = MOVES[m.name];
                return (
                  <button
                    key={m.name}
                    disabled={m.pp <= 0}
                    onClick={() => { onAction({ kind: "move", moveName: m.name, mega: megaArmed && canMega }); setMegaArmed(false); }}
                    className={`p-3 rounded-lg border-2 text-left hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed ${TYPE_COLORS[mv.type]} text-white`}
                  >
                    <div className="font-bold text-sm">{m.name}</div>
                    <div className="text-[10px] uppercase opacity-90">{mv.category} · Pwr {mv.power || "—"}</div>
                    <div className="text-[10px] opacity-90">PP {m.pp}/{m.maxPp}</div>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-3 flex flex-col gap-2">
            <div className="text-sm font-bold">Actions</div>
            <Button variant="outline" onClick={() => setShowSwitch(true)} disabled={state.player.team.filter(p => !p.fainted).length <= 1}>
              Switch Pokémon
            </Button>
            {canMega && (
              <Button
                variant={megaArmed ? "default" : "outline"}
                onClick={() => setMegaArmed((v) => !v)}
                className={megaArmed ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white" : ""}
              >
                {megaArmed ? "✨ Mega Evolve ARMED — pick a move" : "✨ Mega Evolve"}
              </Button>
            )}
            {player.isMega && (
              <div className="text-xs font-bold text-fuchsia-600">⚡ Mega Evolved</div>
            )}
            <div className="text-xs text-muted-foreground mt-auto">
              Speed: {player.stats.spe} · Atk {player.stats.atk} · Def {player.stats.def} · SpA {player.stats.spa} · SpD {player.stats.spd}
            </div>
          </Card>
        </div>
      )}

      {/* Team overview */}
      <Card className="p-3">
        <div className="text-xs font-bold mb-2 text-muted-foreground">YOUR TEAM</div>
        <div className="flex gap-2 flex-wrap">
          {state.player.team.map((p, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded border ${i === state.player.activeIndex ? "border-primary bg-primary/10" : "border-border"} ${p.fainted ? "opacity-40" : ""}`}>
              <PokeSprite name={p.species} className="w-8 h-8" />
              <div className="text-xs">
                <div className="font-bold">{p.species}</div>
                <div>{p.currentHp}/{p.stats.hp}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs font-bold mt-3 mb-2 text-muted-foreground">ENEMY TEAM</div>
        <div className="flex gap-2 flex-wrap">
          {state.enemy.team.map((p, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded border ${i === state.enemy.activeIndex ? "border-destructive bg-destructive/10" : "border-border"} ${p.fainted ? "opacity-40" : ""}`}>
              <PokeSprite name={p.species} className="w-8 h-8" />
              <div className="text-xs">
                <div className="font-bold">{p.species}</div>
                <div>{p.fainted ? "Fainted" : "OK"}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SwitchPanel({ team, activeIndex, onPick, forced }: { team: PokemonInstance[]; activeIndex: number; onPick: (i: number) => void; forced?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {team.map((p, i) => {
        const sp = SPECIES[p.species];
        const disabled = p.fainted || (!forced && i === activeIndex);
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onPick(i)}
            className="p-3 rounded-lg border-2 text-left hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: sp.color }}
          >
            <div className="flex items-center gap-2">
              <PokeSprite name={p.species} className="w-10 h-10" />
              <div>
                <div className="font-bold text-sm">{p.species}</div>
                <div className="text-xs">{p.currentHp}/{p.stats.hp} HP</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


function BattlePage() {
  const [state, setState] = useState<BattleState | null>(null);
  const [trainerIdx, setTrainerIdx] = useState(0);
  const [xpReport, setXpReport] = useState<XpReportEntry[]>([]);

  const startBattle = (picks: string[], tIdx: number) => {
    setTrainerIdx(tIdx);
    setXpReport([]);
    const enemyTeam = buildEnemyTeam(tIdx);
    const playerTeam = buildPlayerTeam(picks);
    setState({
      player: { trainerName: "You", team: playerTeam, activeIndex: 0, megaUsed: false },
      enemy: { trainerName: TRAINERS[tIdx].name, team: enemyTeam, activeIndex: 0, megaUsed: false },
      log: [`A wild challenger appears! ${TRAINERS[tIdx].name} sent out ${enemyTeam[0].species}!`],
      winner: null,
    });
  };

  const awardXp = (battleState: BattleState) => {
    if (battleState.winner !== "player") return;
    const enemySumLevels = battleState.enemy.team.reduce((s, p) => s + p.level, 0);
    // Survivors get the full share; fainted pokemon get a smaller share.
    const report: XpReportEntry[] = [];
    for (const p of battleState.player.team) {
      const share = p.fainted ? 0.4 : 1.0;
      const gained = Math.max(1, Math.round((enemySumLevels * 4) * share));
      const result = addXp(p.baseSpecies, gained);
      report.push({
        name: p.baseSpecies,
        levelBefore: result.before.level,
        levelAfter: result.after.level,
        xpGained: gained,
      });
      if (result.levelsGained > 0) {
        battleState.log.push(
          `✨ ${p.baseSpecies} grew to Lv. ${result.after.level}!`,
        );
      }
    }
    setXpReport(report);
  };

  const handleAction = (action: TurnAction) => {
    if (!state) return;
    const next: BattleState = JSON.parse(JSON.stringify(state));
    const enemyActive = next.enemy.team[next.enemy.activeIndex];
    const playerActive = next.player.team[next.player.activeIndex];

    let enemyAction: TurnAction;
    if (enemyActive.fainted) {
      const idx = chooseAiSwitch(next.enemy.team, playerActive);
      enemyAction = { kind: "switch", switchIndex: idx };
    } else {
      const moveName = chooseAiMove(enemyActive, playerActive, TRAINERS[trainerIdx].strategy);
      const aiCanMega = !next.enemy.megaUsed && !enemyActive.isMega && !!SPECIES[enemyActive.baseSpecies]?.megaForm;
      enemyAction = { kind: "move", moveName, mega: aiCanMega };
    }

    // If player is forced-switching, only do switch (no enemy move)
    if (action.kind === "switch" && playerActive.fainted) {
      next.player.activeIndex = action.switchIndex!;
      next.log.push(`Go! ${next.player.team[next.player.activeIndex].species}!`);
      setState(next);
      return;
    }

    runTurn(next, action, enemyAction);

    // If enemy fainted, queue an AI switch on next tick
    const en = next.enemy.team[next.enemy.activeIndex];
    if (en.fainted && !next.winner) {
      const idx = chooseAiSwitch(next.enemy.team, next.player.team[next.player.activeIndex]);
      if (idx >= 0) {
        next.enemy.activeIndex = idx;
        next.log.push(`${next.enemy.trainerName} sent out ${next.enemy.team[idx].species}!`);
      }
    }

    if (next.winner === "player") awardXp(next);
    setState(next);
  };

  const reset = () => {
    setState(null);
    setXpReport([]);
  };

  if (!state) return <TeamPicker onStart={startBattle} />;
  return <Battle state={state} onAction={handleAction} onReset={reset} xpReport={xpReport} />;
}
