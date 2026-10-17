import { test } from "node:test";
import assert from "node:assert/strict";
import {
  award,
  buyTheme,
  freshWallet,
  migrateWallet,
  secondsText,
  spendHint,
  HINT_COST,
} from "./rewards";
import { Attempt } from "./index";
const attempt = (i: number, extra: Partial<Attempt> = {}): Attempt => ({
  id: `a${i}`,
  profileId: "p",
  name: "P",
  game: "maze",
  level: i,
  variant: 0,
  elapsedMs: 12345,
  moves: 32,
  assisted: false,
  createdAt: "2026-10-16T12:00:00Z",
  ...extra,
});
test("first clears award gems once, chapter bonus exactly once, practice and battles cannot farm", () => {
  let w = freshWallet();
  for (let i = 0; i < 10; i++) {
    const r = award(w, attempt(i));
    assert.equal(r.earned, i === 9 ? 52 : 12);
    w = r.wallet;
  }
  assert.equal(w.gems, 160);
  assert.equal(award(w, attempt(9)).earned, 0);
  assert.equal(award(w, attempt(10, { sessionId: "b" })).earned, 0);
  assert.equal(award(w, attempt(10, { variant: 42 })).earned, 0);
  assert.equal(award(w, attempt(10, { assisted: true })).earned, 6);
});
test("themes enforce balance/wins and owned themes equip without charging again", () => {
  const empty = freshWallet();
  assert.deepEqual(buyTheme(empty, "twilight"), empty);
  let w = migrateWallet(
    Array.from({ length: 10 }, (_, i) => attempt(i)),
    "p",
  );
  w = buyTheme(w, "twilight");
  assert.equal(w.gems, 100);
  assert.equal(w.selected, "twilight");
  assert.equal(buyTheme(w, "twilight").gems, 100);
  assert.equal(buyTheme(w, "ember").selected, "twilight");
});
test("migration preserves old progress without duplicate reward claims and seconds replace raw score", () => {
  const a = [
    attempt(0),
    attempt(0),
    attempt(1),
    attempt(2, { profileId: "other" }),
  ];
  assert.equal(migrateWallet(a, "p").gems, 24);
  assert.equal(secondsText(9020), "9s");
  assert.equal(secondsText(65000), "65s");
});

// Hint spending preserves cosmetic ownership and never makes the balance negative.
test("paid hints conserve gems and reject insufficient balance", () => {
  const w = { ...freshWallet(), gems: 12 };
  const a = spendHint(w)!;
  const b = spendHint(a)!;
  assert.equal(HINT_COST, 5);
  assert.equal(w.gems, 12);
  assert.equal(a.gems, 7);
  assert.equal(b.gems, 2);
  assert.equal(spendHint(b), null);
  assert.deepEqual(b.themes, w.themes);
});
