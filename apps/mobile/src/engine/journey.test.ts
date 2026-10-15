import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMaze, mazeSolved, mazeValid } from "./maze";
import { points, streak, unlocked } from "./journey";
import { Attempt } from "./index";
test("600 maze variants are deterministic, connected trees with valid exits", () => {
  for (let i = 0; i < 30; i++)
    for (let v = 0; v < 20; v++) {
      const m = makeMaze(i, v);
      assert.deepEqual(m, makeMaze(i, v));
      assert.ok(mazeSolved(m, m.solution));
      assert.equal(mazeSolved(m, m.solution.slice(0, -1)), false);
      assert.equal(mazeValid(m, [0, m.size ** 2 - 1]), false);
      assert.equal(mazeValid(m, [0, 0]), false);
      assert.equal(
        m.walls.length,
        2 * m.size * (m.size - 1) - (m.size ** 2 - 1),
      );
    }
});
const attempt = (level: number, extra: Partial<Attempt> = {}): Attempt => ({
  id: String(level),
  profileId: "p",
  name: "P",
  game: "zip",
  level,
  elapsedMs: 10000,
  moves: 20,
  assisted: false,
  createdAt: new Date(2026, 9, 15, 12).toISOString(),
  variant: 0,
  ...extra,
});
test("unlock uses contiguous solo progress per player and game; battle cannot unlock", () => {
  assert.equal(unlocked([], "p", "zip"), 0);
  assert.equal(unlocked([attempt(0), attempt(2)], "p", "zip"), 1);
  assert.equal(unlocked([attempt(0, { sessionId: "battle" })], "p", "zip"), 0);
  assert.equal(unlocked([attempt(0)], "other", "zip"), 0);
  assert.equal(unlocked([attempt(0)], "p", "maze"), 0);
  assert.equal(unlocked([attempt(0), attempt(1)], "p", "zip"), 2);
});
test("hints reduce score and streak uses calendar dates", () => {
  assert.ok(points(attempt(0)) > points(attempt(0, { assisted: true })));
  assert.equal(streak([attempt(0)], "p", new Date(2026, 9, 16, 9)), 1);
  assert.equal(streak([attempt(0)], "p", new Date(2026, 9, 17, 9)), 0);
});
