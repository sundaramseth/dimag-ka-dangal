import test from "node:test";
import assert from "node:assert/strict";
import { makeMaze, mazeSolved, mazeValid, mazeAdjacent } from "./maze";
import { makeZipLevel, zipSolved } from "./zip";
import { PUZZLES, stars, unlocked } from "./journey";
test("all 120 maze and number puzzles across 12 chapters retain deterministic valid solutions", () => {
  const shapes = new Set();
  for (let i = 0; i < PUZZLES; i++)
    for (const v of [0, 11, 921]) {
      const m = makeMaze(i, v);
      shapes.add(m.shape);
      assert.ok(mazeSolved(m, m.solution), `${i}:${v}`);
      assert.deepEqual(m, makeMaze(i, v));
      assert.ok(
        m.solution.every((c, j) => !j || mazeAdjacent(m, m.solution[j - 1], c)),
      );
      assert.equal(mazeValid(m, [m.start, -1]), false);
      const z = makeZipLevel(i, v);
      assert.ok(zipSolved(z, z.solution));
    }
  assert.deepEqual([...shapes].sort(), [
    "cross",
    "diamond",
    "octagon",
    "rings",
    "square",
  ]);
});
test("five-star cutoff, assisted cap and map rule share precise boundaries", () => {
  for (const [elapsedMs, want] of [
    [9999, 5],
    [10000, 4],
    [29999, 4],
    [30000, 3],
    [60000, 2],
    [120000, 1],
  ])
    assert.equal(stars({ elapsedMs, assisted: false }), want);
  assert.equal(stars({ elapsedMs: 5000, assisted: true }), 3);
  assert.equal(unlocked([], "a", "maze"), 0);
});
test("circular mazes wrap around sectors while blocking non-neighbours", () => {
  const m = makeMaze(30);
  assert.equal(m.shape, "rings");
  assert.ok(mazeAdjacent(m, 0, m.size - 1));
  assert.equal(mazeAdjacent(m, 0, 2), false);
  const d = makeMaze(40);
  assert.ok(d.cells!.length < d.size ** 2);
  assert.ok(d.solution.every((c) => d.cells!.includes(c)));
});

test("later Number Trail puzzles keep alternate passages instead of becoming one corridor",()=>{
 for(let i=30;i<120;i++){const z=makeZipLevel(i);const possible=(z.size-1)*(z.size-1);assert.ok(z.walls.length<possible/2);assert.ok(zipSolved(z,z.solution));}
});
