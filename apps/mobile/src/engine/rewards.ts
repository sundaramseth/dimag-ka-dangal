import { Attempt } from "./index";
export type ThemeId =
  "forest" | "alpine" | "falls" | "twilight" | "glacier" | "ember";
export type Wallet = {
  gems: number;
  claimed: string[];
  themes: ThemeId[];
  selected: "auto" | ThemeId;
};
export const freshWallet = (): Wallet => ({
  gems: 0,
  claimed: [],
  themes: ["forest", "alpine", "falls"],
  selected: "auto",
});
export const SHOP = [
  { id: "twilight" as const, name: "Twilight", cost: 60, wins: 5 },
  { id: "glacier" as const, name: "Glacier", cost: 100, wins: 10 },
  { id: "ember" as const, name: "Ember", cost: 150, wins: 20 },
];
export function award(wallet: Wallet, a: Attempt) {
  const key = `${a.game}:${a.level}`;
  if (
    a.sessionId ||
    a.variant !== 0 ||
    !["zip", "maze"].includes(a.game) ||
    wallet.claimed.includes(key)
  )
    return { wallet, earned: 0, bonus: 0 };
  const claimed = [...wallet.claimed, key];
  const first = Math.floor(a.level / 10) * 10;
  const chapterKey = `chapter:${a.game}:${Math.floor(a.level / 10)}`;
  const chapter =
    Array.from({ length: 10 }, (_, i) => `${a.game}:${first + i}`).every((k) =>
      claimed.includes(k),
    ) && !claimed.includes(chapterKey);
  const bonus = chapter ? 40 : 0,
    earned = (a.assisted ? 6 : 12) + bonus;
  if (chapter) claimed.push(chapterKey);
  return {
    wallet: { ...wallet, gems: wallet.gems + earned, claimed },
    earned,
    bonus,
  };
}
export function buyTheme(wallet: Wallet, id: ThemeId): Wallet {
  if (wallet.themes.includes(id)) return { ...wallet, selected: id };
  const item = SHOP.find((x) => x.id === id);
  if (
    !item ||
    wallet.gems < item.cost ||
    wallet.claimed.filter((k) => !k.startsWith("chapter:")).length < item.wins
  )
    return wallet;
  return {
    ...wallet,
    gems: wallet.gems - item.cost,
    themes: [...wallet.themes, id],
    selected: id,
  };
}
export function migrateWallet(attempts: Attempt[], profileId: string) {
  let w = freshWallet();
  for (const a of [...attempts].reverse())
    if (a.profileId === profileId) w = award(w, a).wallet;
  return w;
}
export const secondsText = (ms: number) => `${Math.floor(ms / 1000)}s`;
