// Persistent per-species level/XP stored in localStorage.

export interface PokeProgress {
  level: number;
  xp: number;
}

const KEY = "poke-progress-v1";
export const MIN_LEVEL = 5;
export const MAX_LEVEL = 100;
export const DEFAULT_LEVEL = 50;

export function xpToNext(level: number): number {
  // Quadratic-ish curve, gentle early then steeper
  return Math.floor(20 + level * 8 + level * level * 0.4);
}

type Store = Record<string, PokeProgress>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getProgress(name: string): PokeProgress {
  const store = read();
  return store[name] ?? { level: DEFAULT_LEVEL, xp: 0 };
}

export function getAllProgress(): Store {
  return read();
}

export function setProgress(name: string, p: PokeProgress): void {
  const store = read();
  store[name] = {
    level: Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, p.level)),
    xp: Math.max(0, p.xp),
  };
  write(store);
}

export function addLevels(name: string, n: number): PokeProgress {
  const cur = getProgress(name);
  const next: PokeProgress = {
    level: Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, cur.level + n)),
    xp: 0,
  };
  setProgress(name, next);
  return next;
}

export interface XpGain {
  before: PokeProgress;
  after: PokeProgress;
  levelsGained: number;
  xpAwarded: number;
}

export function addXp(name: string, amount: number): XpGain {
  const before = getProgress(name);
  let { level, xp } = before;
  xp += amount;
  let levelsGained = 0;
  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    levelsGained += 1;
  }
  if (level >= MAX_LEVEL) xp = 0;
  const after = { level, xp };
  setProgress(name, after);
  return { before, after, levelsGained, xpAwarded: amount };
}

export function resetProgress(): void {
  write({});
}
