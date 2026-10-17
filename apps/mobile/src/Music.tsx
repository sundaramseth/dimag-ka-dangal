import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from "expo-audio";
import { listenSound, type SoundEvent } from "./sound";
function setup(p: AudioPlayer, loop: boolean, volume: number) {
  p.loop = loop;
  p.volume = volume;
}
function replay(p: AudioPlayer) {
  if (p.isLoaded)
    p.seekTo(0)
      .then(() => p.play())
      .catch(() => {});
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
  const ambient = useAudioPlayer(require("../assets/audio/journey.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const win = useAudioPlayer(require("../assets/audio/victory.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const move = useAudioPlayer(require("../assets/audio/move.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const level = useAudioPlayer(require("../assets/audio/level.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const tap = useAudioPlayer(require("../assets/audio/tap.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const bump = useAudioPlayer(require("../assets/audio/bump.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const hint = useAudioPlayer(require("../assets/audio/hint.wav"), {
    downloadFirst: true,
    updateInterval: 1000,
  });
  const status = useAudioPlayerStatus(ambient);
  const [ready, setReady] = useState(false);
  const foreground = useRef(true);
  useEffect(() => {
    let alive = true;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "mixWithOthers",
    })
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    setup(ambient, true, 0.46);
    if (enabled && ready && status.isLoaded && foreground.current)
      ambient.play();
    else ambient.pause();
    const sub = AppState.addEventListener("change", (s) => {
      foreground.current = s === "active";
      if (s === "active" && enabled && ready && ambient.isLoaded)
        ambient.play();
      else ambient.pause();
    });
    return () => sub.remove();
  }, [ambient, enabled, ready, status.isLoaded]);
  useEffect(() => {
    const players = { move, win, level, tap, bump, hint };
    Object.values(players).forEach((p) => setup(p, false, 0.65));
    return listenSound((event: SoundEvent) => {
      if (sound && ready && foreground.current) replay(players[event]);
      if (
        Platform.OS === "web" &&
        enabled &&
        ready &&
        ambient.isLoaded &&
        !ambient.playing
      )
        ambient.play();
    });
  }, [ambient, enabled, sound, ready, move, win, level, tap, bump, hint]);
  useEffect(() => {
    if (celebration && sound && ready) replay(win);
  }, [celebration, sound, ready, win]);
  return null;
}
