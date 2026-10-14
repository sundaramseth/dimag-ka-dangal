import { Attempt } from "../engine";
export type Profile = { id: string; name: string; avatar: number };
export type Settings = {
  language: "en" | "hi";
  haptics: boolean;
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
};
export const defaultState: LocalState = {
  profiles: [{ id: "player-1", name: "Player 1", avatar: 0 }],
  attempts: [],
  settings: {
    language: "en",
    haptics: true,
    reducedMotion: false,
    activeProfileId: "player-1",
  },
  feedback: [],
};
export const STATE_KEY = "dangal-state-v1";
