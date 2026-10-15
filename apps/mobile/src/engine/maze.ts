import { adjacent, wallKey } from "./zip";
export type MazeLevel = {
  kind: "maze";
  size: number;
  walls: [number, number][];
  solution: number[];
  checkpoints: Record<number, number>;
};
export function makeMaze(index: number, variant = 0): MazeLevel {
  const size = Math.min(9, 5 + Math.floor(index / 6));
  let seed = (9137 + index * 7919 + variant * 104729) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const visited = new Set([0]),
    stack = [0],
    open = new Set<string>();
  while (stack.length) {
    const a = stack.at(-1)!;
    const options = [a - size, a + 1, a + size, a - 1].filter(
      (b) =>
        b >= 0 && b < size * size && adjacent(size, a, b) && !visited.has(b),
    );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const b = options[Math.floor(random() * options.length)];
    open.add(wallKey(a, b));
    visited.add(b);
    stack.push(b);
  }
  const walls: [number, number][] = [];
  for (let a = 0; a < size * size; a++)
    for (const b of [a + 1, a + size])
      if (b < size * size && adjacent(size, a, b) && !open.has(wallKey(a, b)))
        walls.push([a, b]);
  const search = (a: number, parent: number): number[] | null => {
    if (a === size * size - 1) return [a];
    for (const b of [a - size, a + 1, a + size, a - 1])
      if (
        b !== parent &&
        b >= 0 &&
        b < size * size &&
        adjacent(size, a, b) &&
        open.has(wallKey(a, b))
      ) {
        const tail = search(b, a);
        if (tail) return [a, ...tail];
      }
    return null;
  };
  return {
    kind: "maze",
    size,
    walls,
    solution: search(0, -1)!,
    checkpoints: { 0: 1, [size * size - 1]: 2 },
  };
}
export function mazeValid(level: MazeLevel, path: number[]) {
  const walls = new Set(level.walls.map(([a, b]) => wallKey(a, b)));
  return (
    path.length > 0 &&
    path[0] === 0 &&
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
  mazeValid(level, path) && path.at(-1) === level.size ** 2 - 1;
