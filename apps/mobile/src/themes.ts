import { ThemeId, Wallet } from "./engine/rewards";
export type Theme = {
  id: ThemeId;
  name: string;
  ground: string;
  field: string;
  wall: string;
  path: string;
  tile: string;
  ink: string;
  accent: string;
  scene: "forest" | "mountain" | "waterfall";
};
export const THEMES: Record<ThemeId, Theme> = {
  forest: {
    id: "forest",
    name: "Emerald Woods",
    ground: "#E6EED3",
    field: "#F4F3D8",
    wall: "#387146",
    path: "#D28B35",
    tile: "#D9E8BA",
    ink: "#203D30",
    accent: "#6DAF64",
    scene: "forest",
  },
  alpine: {
    id: "alpine",
    name: "Mountain Pass",
    ground: "#DDE7E8",
    field: "#EDF1E9",
    wall: "#526C7A",
    path: "#D27D48",
    tile: "#D7E0CC",
    ink: "#253D4A",
    accent: "#6C9FA3",
    scene: "mountain",
  },
  falls: {
    id: "falls",
    name: "Hidden Falls",
    ground: "#DAECE6",
    field: "#EAF4ED",
    wall: "#30746C",
    path: "#BF8DDB",
    tile: "#C6E4D7",
    ink: "#23483F",
    accent: "#45A5A2",
    scene: "waterfall",
  },
  twilight: {
    id: "twilight",
    name: "Twilight",
    ground: "#DFDBF0",
    field: "#EDE8F5",
    wall: "#63528B",
    path: "#BA6DB7",
    tile: "#DCD0E9",
    ink: "#392D54",
    accent: "#8872AF",
    scene: "forest",
  },
  glacier: {
    id: "glacier",
    name: "Glacier",
    ground: "#D9EAF2",
    field: "#F0F7FA",
    wall: "#4E809E",
    path: "#57B6CB",
    tile: "#D0E7F4",
    ink: "#24465B",
    accent: "#70ACCC",
    scene: "mountain",
  },
  ember: {
    id: "ember",
    name: "Ember Canyon",
    ground: "#EFDCC8",
    field: "#FAEDDA",
    wall: "#9B5B48",
    path: "#C75D32",
    tile: "#ECD0AC",
    ink: "#593B2D",
    accent: "#D48D4B",
    scene: "mountain",
  },
};
export const chapterTheme = (i: number): ThemeId =>
  (["forest", "alpine", "falls", "twilight", "glacier", "ember"] as ThemeId[])[
    Math.floor(i / 10) % 6
  ];
export const effectiveTheme = (wallet: Wallet, index: number) =>
  THEMES[wallet.selected === "auto" ? chapterTheme(index) : wallet.selected];

const trailThemeCache = new Map<string, Theme>();
export function gameTheme(
  wallet: Wallet,
  index: number,
  game: "zip" | "maze",
): Theme {
  const t = effectiveTheme(wallet, index);
  const key = `${t.id}:${Math.floor(index / 10)}:${wallet.selected}`;
  if (game === "zip" && trailThemeCache.has(key))
    return trailThemeCache.get(key)!;
  const result: Theme =
    game === "maze"
      ? t
      : {
          ...t,
          name: ["Lumi Gardens", "Starlight Steps", "Aurora Isles"][
            Math.floor(index / 10) % 3
          ],
          ground: ["#E8DEF4", "#DCE9F8", "#D9F0EA"][Math.floor(index / 10) % 3],
          field: "#FCF9FF",
          wall: "#776398",
          path: wallet.selected === "auto" ? "#AE71CF" : t.path,
          tile: "#E8DFF5",
          ink: "#44365D",
          accent: "#B59AD7",
        };
  if (game === "zip") trailThemeCache.set(key, result);
  return result;
}
