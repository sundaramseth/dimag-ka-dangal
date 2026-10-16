import { Wallet, migrateWallet } from "../engine/rewards";
import { Attempt } from "../engine";
export type Profile = { id: string; name: string; avatar: number };
export type Settings = {
  language: "en" | "hi";
  haptics: boolean;
  music: boolean;
  sound: boolean;
  reducedMotion: boolean;
  activeProfileId: string;
};
export type Feedback = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
};
export type LocalState = {
  profiles: Profile[];
  attempts: Attempt[];
  settings: Settings;
  feedback: Feedback[];
  wallets: Record<string, Wallet>;
};
export const defaultState: LocalState = {
  profiles: [{ id: "player-1", name: "Player 1", avatar: 0 }],
  attempts: [],
  settings: {
    language: "en",
    haptics: true,
    music: true,
    sound: true,
    reducedMotion: false,
    activeProfileId: "player-1",
  },
  feedback: [],
  wallets: {},
};
export const STATE_KEY = "dangal-state-v1";

export function hydrateState(value: LocalState): LocalState {
  const wallets = { ...value.wallets };
  for (const p of value.profiles)
    if (!wallets[p.id]) wallets[p.id] = migrateWallet(value.attempts, p.id);
  return {
    ...value,
    wallets,
    settings: { ...defaultState.settings, ...value.settings },
  };
}
