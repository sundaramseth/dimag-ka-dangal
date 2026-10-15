import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeZipLevel,
  zipPrefixError,
  zipSolved,
  zipHint,
  adjacent,
} from "./zip";
test("all 30 Number Trail puzzles and 100 family variants have valid full paths", () => {
  const shapes = new Set<string>();
  for (let i = 0; i < 30; i++)
    for (let v = 0; v < 100; v++) {
      const l = makeZipLevel(i, v);
      assert.equal(new Set(l.solution).size, l.size * l.size);
      assert.equal(zipPrefixError(l, l.solution), null);
      assert(zipSolved(l, l.solution));
      assert.deepEqual(l, makeZipLevel(i, v));
      assert(!zipSolved(l, l.solution.slice(0, -1)));
      l.walls.forEach(([a, b]) => assert(adjacent(l.size, a, b)));
      shapes.add(l.solution.join(","));
    }
  assert(shapes.size > 100);
});
test("reject wrong start, repeat, diagonals, out-of-order numbers, walls, early final number", () => {
  const base = {
    kind: "zip" as const,
    size: 2,
    checkpoints: { 0: 1, 2: 2 },
    walls: [] as [number, number][],
    solution: [0, 1, 3, 2],
  };
  assert.equal(zipPrefixError(base, [1]), "start");
  assert.equal(zipPrefixError(base, [0, 1, 0]), "repeat");
  assert.equal(zipPrefixError(base, [0, 3]), "adjacent");
  assert.equal(zipPrefixError(base, [0, 2]), "finish");
  assert.equal(zipPrefixError({ ...base, walls: [[0, 1]] }, [0, 1]), "wall");
  assert.equal(
    zipPrefixError({ ...base, checkpoints: { 0: 1, 1: 3, 2: 2 } }, [0, 1]),
    "order",
  );
  assert.equal(zipPrefixError(base, [0, -1]), "bounds");
  assert(zipSolved(base, [0, 1, 3, 2]));
});
test("every solution prefix is legal and hints repair divergent routes without invalid jumps", () => {
  for (let i = 0; i < 30; i++) {
    const l = makeZipLevel(i);
    for (let k = 0; k < l.solution.length; k++) {
      const prefix = l.solution.slice(0, k);
      assert.equal(zipPrefixError(l, prefix), null);
      assert.deepEqual(zipHint(l, prefix), l.solution.slice(0, k + 1));
    }
    assert.equal(zipPrefixError(l, zipHint(l, [l.solution[0], 999])), null);
    assert.deepEqual(zipHint(l, l.solution), l.solution);
  }
});
