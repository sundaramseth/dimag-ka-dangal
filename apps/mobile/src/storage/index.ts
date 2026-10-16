import * as SQLite from "expo-sqlite";
import { LocalState, defaultState, STATE_KEY, hydrateState } from "./types";
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  if (!database)
    database = SQLite.openDatabaseAsync("dangal.db").then(async (d) => {
      await d.execAsync(
        "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS local_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);",
      );
      return d;
    });
  return database;
}
export async function loadState(): Promise<LocalState> {
  const row = await (
    await db()
  ).getFirstAsync<{ value: string }>(
    "SELECT value FROM local_state WHERE key=?",
    STATE_KEY,
  );
  return hydrateState(
    row ? JSON.parse(row.value) : JSON.parse(JSON.stringify(defaultState)),
  );
}
export async function saveState(state: LocalState) {
  await (
    await db()
  ).runAsync(
    "INSERT INTO local_state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    STATE_KEY,
    JSON.stringify(state),
  );
}
