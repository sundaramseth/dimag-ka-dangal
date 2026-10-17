import { useEffect, useRef } from "react";
import { Asset } from "expo-asset";
import { listenSound, type SoundEvent } from "./sound";
const sources = {
  ambient: require("../assets/audio/journey.wav"),
  win: require("../assets/audio/victory.wav"),
  move: require("../assets/audio/move.wav"),
  level: require("../assets/audio/level.wav"),
  tap: require("../assets/audio/tap.wav"),
  bump: require("../assets/audio/bump.wav"),
  hint: require("../assets/audio/hint.wav"),
};
function play(a: HTMLAudioElement, restart = false) {
  if (restart) a.currentTime = 0;
  void a.play().catch(() => {});
}
export function Music({
  enabled,
  sound,
  celebration,
}: {
  enabled: boolean;
  sound: boolean;
  celebration: string | null;
}) {
  const players = useRef<Record<string, HTMLAudioElement>>({});
  useEffect(() => {
    const a = Object.fromEntries(
      Object.entries(sources).map(([name, source]) => {
        const p = new Audio(Asset.fromModule(source).uri);
        p.preload = "auto";
        p.volume = name === "ambient" ? 0.46 : 0.65;
        p.loop = name === "ambient";
        return [name, p];
      }),
    );
    players.current = a;
    return () => {
      for (const p of Object.values(a)) {
        p.pause();
        p.removeAttribute("src");
        p.load();
      }
      players.current = {};
    };
  }, []);
  useEffect(() => {
    const ambient = players.current.ambient;
    if (!ambient) return;
    const sync = () => {
      if (enabled && !document.hidden) play(ambient);
      else ambient.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    const unsub = listenSound((event: SoundEvent) => {
      if (document.hidden) return;
      if (enabled && ambient.paused) play(ambient);
      if (sound && players.current[event]) play(players.current[event], true);
    });
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled, sound]);
  useEffect(() => {
    if (celebration && sound && players.current.win)
      play(players.current.win, true);
  }, [celebration, sound]);
  return null;
}
