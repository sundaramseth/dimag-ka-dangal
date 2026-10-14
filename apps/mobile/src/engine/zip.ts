export type ZipLevel = {
  kind: "zip";
  size: number;
  checkpoints: Record<number, number>;
  walls: [number, number][];
  solution: number[];
};
export const wallKey = (a: number, b: number) =>
  `${Math.min(a, b)}:${Math.max(a, b)}`;
export function adjacent(size: number, a: number, b: number) {
  return (
    Math.abs(Math.floor(a / size) - Math.floor(b / size)) +
      Math.abs((a % size) - (b % size)) ===
    1
  );
}
export function makeZipLevel(index: number, variant = 0): ZipLevel {
  const size = index < 4 ? 4 : index < 7 ? 5 : 6;
  let seed = (3229 + index * 7919 + variant * 104729) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let route = Array.from(
    { length: size * size },
    (_, i) =>
      Math.floor(i / size) * size +
      (Math.floor(i / size) % 2 ? size - 1 - (i % size) : i % size),
  );
  // Backbite rewiring preserves a Hamiltonian path while varying its shape/endpoints.
  for (let step = 0; step < 160; step++) {
    const head = random() < 0.5;
    const end = head ? route[0] : route.at(-1)!;
    const options = route
      .map((cell, i) => ({ cell, i }))
      .filter(
        ({ cell, i }) =>
          adjacent(size, end, cell) && (head ? i > 1 : i < route.length - 2),
      );
    if (!options.length) continue;
    const k = options[Math.floor(random() * options.length)].i;
    route = head
      ? [...route.slice(0, k).reverse(), ...route.slice(k)]
      : [...route.slice(0, k + 1), ...route.slice(k + 1).reverse()];
  }
  const count = index < 4 ? 5 : index < 7 ? 7 : 9;
  const checkpoints: Record<number, number> = {};
  for (let i = 0; i < count; i++)
    checkpoints[route[Math.round((i * (route.length - 1)) / (count - 1))]] =
      i + 1;
  const used = new Set(
    route.slice(1).map((cell, i) => wallKey(route[i], cell)),
  );
  const candidates: [number, number][] = [];
  for (let a = 0; a < size * size; a++)
    for (const b of [a + 1, a + size])
      if (b < size * size && adjacent(size, a, b) && !used.has(wallKey(a, b)))
        candidates.push([a, b]);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return {
    kind: "zip",
    size,
    checkpoints,
    walls: candidates.slice(
      0,
      index < 2 ? 0 : Math.min(index + 1, candidates.length),
    ),
    solution: route,
  };
}
export type ZipError =
  "start" | "bounds" | "repeat" | "adjacent" | "wall" | "order" | "finish";
export function zipPrefixError(
  level: ZipLevel,
  path: number[],
): ZipError | null {
  if (!path.length) return null;
  const seen = new Set<number>();
  let next = 1;
  const walls = new Set(level.walls.map(([a, b]) => wallKey(a, b)));
  const last = Math.max(...Object.values(level.checkpoints));
  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (!Number.isInteger(cell) || cell < 0 || cell >= level.size * level.size)
      return "bounds";
    if (i === 0 && level.checkpoints[cell] !== 1) return "start";
    if (seen.has(cell)) return "repeat";
    if (i && !adjacent(level.size, path[i - 1], cell)) return "adjacent";
    if (i && walls.has(wallKey(path[i - 1], cell))) return "wall";
    const number = level.checkpoints[cell];
    if (number) {
      if (number !== next) return "order";
      if (number === last && i !== level.size * level.size - 1) return "finish";
      next++;
    }
    seen.add(cell);
  }
  return null;
}
export function zipSolved(level: ZipLevel, path: number[]) {
  return (
    path.length === level.size * level.size &&
    zipPrefixError(level, path) === null &&
    level.checkpoints[path.at(-1)!] ===
      Math.max(...Object.values(level.checkpoints))
  );
}
export function zipHint(level: ZipLevel, path: number[]) {
  let shared = 0;
  while (shared < path.length && path[shared] === level.solution[shared])
    shared++;
  return level.solution.slice(0, Math.min(shared + 1, level.solution.length));
}
