import { LocalState, defaultState, STATE_KEY } from "./types";
// Browser preview only. Android uses the SQLite adapter in index.ts.
export async function loadState(): Promise<LocalState> {
  const value = localStorage.getItem(STATE_KEY);
  return value ? JSON.parse(value) : JSON.parse(JSON.stringify(defaultState));
}
export async function saveState(state: LocalState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
