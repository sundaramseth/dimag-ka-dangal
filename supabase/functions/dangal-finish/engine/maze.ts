import { adjacent, wallKey } from "./zip.ts";
export type MazeLevel = {
  kind: "maze";
  shape?: "square" | "rings" | "diamond" | "cross" | "octagon";
  cells?: number[];
  size: number;
  walls: [number, number][];
  solution: number[];
  checkpoints: Record<number, number>;
  relics: number[];
  start: number;
  end: number;
};
export function makeMaze(index: number, variant = 0): MazeLevel {
  const shape =
    index < 30
      ? "square"
      : (["rings", "diamond", "octagon", "cross", "square"] as const)[
          Math.floor(index / 10 - 3) % 5
        ];
  const size = shape === "rings" ? 7 : index < 10 ? 8 : index < 20 ? 10 : 12;
  const cells = Array.from({ length: size * size }, (_, i) => i).filter((i) => {
    const x = Math.abs((i % size) - (size - 1) / 2),
      y = Math.abs(Math.floor(i / size) - (size - 1) / 2);
    return shape === "diamond"
      ? x + y <= size / 2
      : shape === "cross"
        ? x < size / 4 || y < size / 4
        : shape === "octagon"
          ? x + y < size * 0.75
          : true;
  });
  const allowed = new Set(cells);
  let seed = (43019 + index * 7919 + variant * 104729) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Randomised Prim produces many short misleading branches, unlike the old long DFS corridors.
  const visited = new Set([cells[0]]),
    frontier: [number, number][] = [];
  const passages = new Set<string>();
  const neighbours = (a: number) =>
    (shape === "rings"
      ? [
          a - size,
          a + size,
          Math.floor(a / size) * size + ((a + 1) % size),
          Math.floor(a / size) * size + ((a + size - 1) % size),
        ]
      : [a - size, a + 1, a + size, a - 1]
    ).filter(
      (b) => allowed.has(b) && (shape === "rings" || adjacent(size, a, b)),
    );
  const expand = (a: number) => {
    for (const b of neighbours(a)) if (!visited.has(b)) frontier.push([a, b]);
  };
  expand(cells[0]);
  while (frontier.length) {
    const i = Math.floor(random() * frontier.length);
    const [a, b] = frontier[i];
    frontier[i] = frontier.at(-1)!;
    frontier.pop();
    if (visited.has(b)) continue;
    visited.add(b);
    passages.add(wallKey(a, b));
    expand(b);
  }
  const walk = (from: number) => {
    const distance = Array(size * size).fill(-1) as number[],
      parent = Array(size * size).fill(-1) as number[],
      queue = [from];
    distance[from] = 0;
    for (let i = 0; i < queue.length; i++)
      for (const b of neighbours(queue[i]))
        if (distance[b] < 0 && passages.has(wallKey(queue[i], b))) {
          distance[b] = distance[queue[i]] + 1;
          parent[b] = queue[i];
          queue.push(b);
        }
    let far = from;
    distance.forEach((v, i) => {
      if (v > distance[far]) far = i;
    });
    return { far, parent, distance };
  };
  const start = walk(cells[0]).far,
    { far: end, parent } = walk(start);
  const route: number[] = [];
  for (let c = end; c !== -1; c = parent[c]) route.push(c);
  route.reverse();
  const walls: [number, number][] = [];
  for (const a of cells)
    for (const b of neighbours(a))
      if (a < b && !passages.has(wallKey(a, b))) walls.push([a, b]);
  const count = index < 10 ? 2 : 3;
  const relics = Array.from(
    { length: count },
    (_, i) => route[Math.round(((i + 1) * (route.length - 1)) / (count + 1))],
  );
  return {
    kind: "maze",
    shape,
    cells,
    size,
    walls,
    solution: route,
    checkpoints: { [start]: 1, [end]: 2 },
    relics,
    start,
    end,
  };
}
export function mazeValid(level: MazeLevel, path: number[]) {
  const walls = new Set(level.walls.map(([a, b]) => wallKey(a, b)));
  return (
    path.length > 0 &&
    path[0] === level.start &&
    new Set(path).size === path.length &&
    path.every(
      (c, i) =>
        Number.isInteger(c) &&
        c >= 0 &&
        c < level.size ** 2 &&
        (!level.cells || level.cells.includes(c)) &&
        (!i ||
          (mazeAdjacent(level, path[i - 1], c) &&
            !walls.has(wallKey(path[i - 1], c)))),
    )
  );
}
export const mazeSolved = (level: MazeLevel, path: number[]) =>
  mazeValid(level, path) &&
  path.at(-1) === level.end &&
  level.relics.every((c) => path.includes(c));

export function mazeAdjacent(level: MazeLevel, a: number, b: number) {
  if (level.shape !== "rings") return adjacent(level.size, a, b);
  const s = level.size,
    ar = Math.floor(a / s),
    br = Math.floor(b / s),
    ac = a % s,
    bc = b % s;
  return (
    (Math.abs(ar - br) === 1 && ac === bc) ||
    (ar === br && (Math.abs(ac - bc) === 1 || Math.abs(ac - bc) === s - 1))
  );
}
