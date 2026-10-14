import assert from "node:assert/strict";
import { test } from "node:test";
import {
  makeLevel,
  pathSolved,
  sumSolved,
  rotate,
  compareAttempts,
  Attempt,
} from "./index";
test("all path levels and family variants are solvable, shuffled, and deterministic", () => {
  for (let i = 0; i < 10; i++)
    for (let v = 0; v < 40; v++) {
      const l = makeLevel("path", i, v);
      assert.equal(l.kind, "path");
      if (l.kind !== "path") continue;
      assert(pathSolved(l, l.solution));
      assert(!pathSolved(l, l.tiles));
      assert.deepEqual(l, makeLevel("path", i, v));
      assert(
        !pathSolved(
          l,
          l.solution.map(() => 0),
        ),
      );
    }
});
test("rotation preserves four-turn identity and direction bits", () => {
  for (const mask of [3, 6, 12, 9, 5, 10]) {
    let n = mask;
    for (let i = 0; i < 4; i++) n = rotate(n);
    assert.equal(n, mask);
  }
  assert.equal(rotate(3), 6);
});
test("sum boards accept a correct solution, reject blank and malformed attempts", () => {
  for (let i = 0; i < 10; i++)
    for (let v = 0; v < 40; v++) {
      const l = makeLevel("sum", i, v);
      if (l.kind !== "sum") throw Error();
      assert(sumSolved(l, l.solution));
      assert(
        !sumSolved(
          l,
          l.values.map(() => false),
        ),
      );
      assert(!sumSolved(l, []));
      assert(l.rows.every((n) => n > 0));
      assert(l.cols.every((n) => n > 0));
      assert.deepEqual(l, makeLevel("sum", i, v));
    }
});
test("memory levels progress in length with valid non-repeating adjacent tiles", () => {
  for (let i = 0; i < 10; i++) {
    const l = makeLevel("memory", i);
    if (l.kind !== "memory") throw Error();
    assert.equal(l.sequence.length, 3 + Math.floor(i / 2));
    l.sequence.forEach((v, k) => {
      assert(v >= 0 && v < 9);
      if (k) assert.notEqual(v, l.sequence[k - 1]);
    });
  }
});
test("clean results outrank hints, then time, then moves", () => {
  const a = { assisted: false, elapsedMs: 10000, moves: 5 } as Attempt;
  const hint = { ...a, assisted: true, elapsedMs: 1 };
  assert(compareAttempts(a, hint) < 0);
  assert(compareAttempts(a, { ...a, elapsedMs: 11000 }) < 0);
  assert(compareAttempts(a, { ...a, moves: 6 }) < 0);
});
