import { makeMaze, MazeLevel } from "./maze";
import { makeZipLevel, ZipLevel } from "./zip";
export {
  makeZipLevel,
  zipSolved,
  zipPrefixError,
  zipHint,
  adjacent,
  wallKey,
} from "./zip";
export type { ZipLevel } from "./zip";
export type Game = "path" | "sum" | "memory" | "zip" | "maze";
export type Difficulty = "easy" | "medium" | "hard";
export const ENGINE_VERSION = 1;
export type PathLevel = {
  kind: "path";
  size: number;
  tiles: number[];
  solution: number[];
  start: number;
  end: number;
};
export type SumLevel = {
  kind: "sum";
  size: number;
  values: number[];
  solution: boolean[];
  rows: number[];
  cols: number[];
};
export type MemoryLevel = {
  kind: "memory";
  sequence: number[];
  revealMs: number;
};
export type Level = PathLevel | SumLevel | MemoryLevel | ZipLevel | MazeLevel;
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function rotate(mask: number) {
  return ((mask << 1) & 15) | ((mask >> 3) & 1);
}
// Bits: north=1, east=2, south=4, west=8. Rotation clockwise.
export function makeLevel(game: Game, index: number, variant = 0): Level {
  if (game === "maze") return makeMaze(index, variant);
  if (game === "zip") return makeZipLevel(index, variant);
  const random = rng(1009 + index * 7919 + variant * 104729);
  const size = index < 4 ? 3 : 4;
  if (game === "path") {
    const route: number[] = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        route.push(y * size + (y % 2 ? size - 1 - x : x));
    const solution = Array(size * size).fill(0) as number[];
    const dir = (a: number, b: number) =>
      b === a - size ? 1 : b === a + 1 ? 2 : b === a + size ? 4 : 8;
    route.forEach((cell, i) => {
      solution[cell] =
        (i === 0 ? 8 : dir(cell, route[i - 1])) |
        (i === route.length - 1
          ? cell % size === 0
            ? 8
            : 2
          : dir(cell, route[i + 1]));
    });
    const tiles = solution.map((mask) => {
      for (let n = Math.floor(random() * 4); n > 0; n--) mask = rotate(mask);
      return mask;
    });
    if (
      pathSolved(
        {
          kind: "path",
          size,
          tiles,
          solution,
          start: route[0],
          end: route.at(-1)!,
        },
        tiles,
      )
    )
      tiles[0] = rotate(tiles[0]);
    return {
      kind: "path",
      size,
      tiles,
      solution,
      start: route[0],
      end: route.at(-1)!,
    };
  }
  if (game === "sum") {
    const values = Array.from(
      { length: size * size },
      () => 1 + Math.floor(random() * 9),
    );
    const solution = values.map(
      (_, i) => i % size === Math.floor(i / size) || random() > 0.52,
    );
    const rows = Array(size).fill(0),
      cols = Array(size).fill(0);
    values.forEach((v, i) => {
      if (solution[i]) {
        rows[Math.floor(i / size)] += v;
        cols[i % size] += v;
      }
    });
    return { kind: "sum", size, values, solution, rows, cols };
  }
  const length = 3 + Math.floor(index / 2);
  const sequence: number[] = [];
  while (sequence.length < length) {
    const n = Math.floor(random() * 9);
    if (sequence.at(-1) !== n) sequence.push(n);
  }
  return { kind: "memory", sequence, revealMs: index < 4 ? 650 : 500 };
}
export function pathSolved(level: PathLevel, tiles: number[]) {
  const { size, start, end } = level;
  if (
    tiles.length !== size * size ||
    !(tiles[start] & 8) ||
    !(tiles[end] & (end % size === 0 ? 8 : 2))
  )
    return false;
  let current = start,
    previous = -1;
  const visited = new Set<number>();
  while (true) {
    if (visited.has(current)) return false;
    visited.add(current);
    if (current === end) return visited.size === size * size;
    const next: number[] = [];
    for (const [bit, opposite, delta] of [
      [1, 4, -size],
      [2, 8, 1],
      [4, 1, size],
      [8, 2, -1],
    ]) {
      if (!(tiles[current] & bit)) continue;
      const target = current + delta;
      if (
        target < 0 ||
        target >= tiles.length ||
        (bit === 2 && current % size === size - 1) ||
        (bit === 8 && current % size === 0)
      )
        continue;
      if (target !== previous && tiles[target] & opposite) next.push(target);
    }
    if (next.length !== 1) return false;
    previous = current;
    current = next[0];
  }
}
export function sumSolved(level: SumLevel, selected: boolean[]) {
  if (selected.length !== level.values.length) return false;
  const rows = Array(level.size).fill(0),
    cols = Array(level.size).fill(0);
  level.values.forEach((v, i) => {
    if (selected[i]) {
      rows[Math.floor(i / level.size)] += v;
      cols[i % level.size] += v;
    }
  });
  return (
    rows.every((v, i) => v === level.rows[i]) &&
    cols.every((v, i) => v === level.cols[i])
  );
}
export type Attempt = {
  id: string;
  profileId: string;
  name: string;
  game: Game;
  level: number;
  elapsedMs: number;
  moves: number;
  assisted: boolean;
  createdAt: string;
  sessionId?: string;
  variant: number;
};
export function compareAttempts(a: Attempt, b: Attempt) {
  return (
    Number(a.assisted) - Number(b.assisted) ||
    a.elapsedMs - b.elapsedMs ||
    a.moves - b.moves
  );
}
export function levelDifficulty(index: number): Difficulty {
  return index < 4 ? "easy" : index < 7 ? "medium" : "hard";
}
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
