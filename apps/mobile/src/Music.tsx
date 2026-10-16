import { useEffect } from "react";
import type { AudioPlayer } from "expo-audio";
import { AppState } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
function configurePlayer(player: AudioPlayer, loop: boolean, volume: number) {
  player.loop = loop;
  player.volume = volume;
}
export function Music({
  enabled,
  celebration,
  sound,
}: {
  enabled: boolean;
  celebration: string | null;
  sound: boolean;
}) {
  const ambient = useAudioPlayer(require("../assets/audio/journey.wav"), {
    updateInterval: 1000,
  });
  const win = useAudioPlayer(require("../assets/audio/victory.wav"), {
    updateInterval: 1000,
  });
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});
  }, []);
  useEffect(() => {
    configurePlayer(ambient, true, 0.22);
    if (enabled) ambient.play();
    else ambient.pause();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && enabled) ambient.play();
      else ambient.pause();
    });
    return () => {
      sub.remove();
      ambient.pause();
    };
  }, [ambient, enabled]);
  useEffect(() => {
    if (!celebration || !sound) return;
    configurePlayer(win, false, 0.65);
    win
      .seekTo(0)
      .then(() => win.play())
      .catch(() => {});
  }, [celebration, sound, win]);
  return null;
}
