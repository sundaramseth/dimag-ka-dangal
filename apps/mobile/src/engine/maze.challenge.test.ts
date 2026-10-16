import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMaze, mazeSolved } from "./maze";
import { adjacent, wallKey } from "./zip";
test("maze chapters grow and generated boards retain meaningful branches and mandatory crystals", () => {
  for (let i = 0; i < 30; i++)
    for (let v = 0; v < 20; v++) {
      const m = makeMaze(i, v);
      assert.equal(m.size, i < 10 ? 8 : i < 20 ? 10 : 12);
      const blocked = new Set(m.walls.map(([a, b]) => wallKey(a, b)));
      let branches = 0;
      for (let a = 0; a < m.size ** 2; a++) {
        const degree = [a - m.size, a + 1, a + m.size, a - 1].filter(
          (b) =>
            b >= 0 &&
            b < m.size ** 2 &&
            adjacent(m.size, a, b) &&
            !blocked.has(wallKey(a, b)),
        ).length;
        if (degree >= 3) branches++;
      }
      assert.ok(branches >= 8);
      assert.ok(m.solution.length >= 16);
      assert.equal(new Set(m.relics).size, m.relics.length);
      assert.ok(m.relics.every((c) => m.solution.includes(c)));
      assert.ok(mazeSolved(m, m.solution));
      assert.equal(mazeSolved({ ...m, relics: [-1] }, m.solution), false);
    }
});
