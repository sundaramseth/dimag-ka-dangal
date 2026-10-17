export type SoundEvent = "move" | "win" | "level" | "tap" | "bump" | "hint";
type Listener = (event: SoundEvent) => void;
const listeners = new Set<Listener>();
let lastMove = 0,
  lastBump = 0;
export function emitSound(event: SoundEvent) {
  const now = Date.now();
  if (event === "move") {
    if (now - lastMove < 85) return;
    lastMove = now;
  }
  if (event === "bump") {
    if (now - lastBump < 300) return;
    lastBump = now;
  }
  listeners.forEach((f) => f(event));
}
export function listenSound(f: Listener) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}
