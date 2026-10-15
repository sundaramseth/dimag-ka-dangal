import { Attempt } from "./index";
export type JourneyGame = "zip" | "maze";
export const PUZZLES = 30;
export function unlocked(
  attempts: Attempt[],
  profileId: string,
  game: JourneyGame,
) {
  const solved = new Set(
    attempts
      .filter(
        (a) =>
          a.profileId === profileId &&
          a.game === game &&
          !a.sessionId &&
          a.variant === 0,
      )
      .map((a) => a.level),
  );
  let next = 0;
  while (solved.has(next) && next < PUZZLES) next++;
  return Math.min(PUZZLES - 1, next);
}
export function points(a: Pick<Attempt, "elapsedMs" | "assisted" | "moves">) {
  return (
    Math.max(100, 1000 - Math.floor(a.elapsedMs / 1000) * 3 - a.moves) *
    (a.assisted ? 0.5 : 1)
  );
}
export function streak(
  attempts: Attempt[],
  profileId: string,
  now = new Date(),
) {
  const day = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const dates = new Set(
    attempts
      .filter((a) => a.profileId === profileId)
      .map((a) => day(new Date(a.createdAt))),
  );
  const d = new Date(now);
  if (!dates.has(day(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dates.has(day(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
