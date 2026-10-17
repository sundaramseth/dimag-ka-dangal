import { adjacent, wallKey } from "./zip.ts";
export type MazeLevel = {
  kind: "maze";
  size: number;
  walls: [number, number][];
  solution: number[];
  checkpoints: Record<number, number>;
  relics: number[];
  start: number;
  end: number;
};
export function makeMaze(index: number, variant = 0): MazeLevel {
  const size = index < 10 ? 8 : index < 20 ? 10 : 12;
  let seed = (43019 + index * 7919 + variant * 104729) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Randomised Prim produces many short misleading branches, unlike the old long DFS corridors.
  const visited = new Set([0]),
    frontier: [number, number][] = [];
  const passages = new Set<string>();
  const neighbours = (a: number) =>
    [a - size, a + 1, a + size, a - 1].filter(
      (b) => b >= 0 && b < size * size && adjacent(size, a, b),
    );
  const expand = (a: number) => {
    for (const b of neighbours(a)) if (!visited.has(b)) frontier.push([a, b]);
  };
  expand(0);
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
  const start = walk(0).far,
    { far: end, parent } = walk(start);
  const route: number[] = [];
  for (let c = end; c !== -1; c = parent[c]) route.push(c);
  route.reverse();
  const walls: [number, number][] = [];
  for (let a = 0; a < size * size; a++)
    for (const b of [a + 1, a + size])
      if (
        b < size * size &&
        adjacent(size, a, b) &&
        !passages.has(wallKey(a, b))
      )
        walls.push([a, b]);
  const count = index < 10 ? 2 : 3;
  const relics = Array.from(
    { length: count },
    (_, i) => route[Math.round(((i + 1) * (route.length - 1)) / (count + 1))],
  );
  return {
    kind: "maze",
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
        (!i ||
          (adjacent(level.size, path[i - 1], c) &&
            !walls.has(wallKey(path[i - 1], c)))),
    )
  );
}
export const mazeSolved = (level: MazeLevel, path: number[]) =>
  mazeValid(level, path) &&
  path.at(-1) === level.end &&
  level.relics.every((c) => path.includes(c));
