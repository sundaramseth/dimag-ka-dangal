import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Text, View, useWindowDimensions } from "react-native";
import {
  Attempt,
  makeZipLevel,
  zipHint,
  zipPrefixError,
  zipSolved,
} from "./engine";
import { makeMaze, mazeSolved, mazeValid } from "./engine/maze";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Character, STORIES } from "./Character";
import { emitSound } from "./sound";
import { secondsText } from "./engine/rewards";
import { Theme, THEMES } from "./themes";
import { ZipBoard } from "./ZipBoard";
import { Button, C, styles } from "./ui";
export type FinishStats = Pick<Attempt, "elapsedMs" | "moves" | "assisted"> & {
  path: number[];
};
export type ActiveGame = "zip" | "maze";
export function GameScreen({
  game,
  index,
  variant,
  hi,
  onExit,
  onFinish,
  theme = THEMES.forest,
  gems = 0,
  playerName = "Player",
  onHint = () => false,
  online = false,
}: {
  gems?: number;
  playerName?: string;
  onHint?: () => boolean;
  online?: boolean;
  theme?: Theme;
  game: ActiveGame;
  index: number;
  variant: number;
  hi: boolean;
  onExit: () => void;
  onFinish: (stats: FinishStats) => void;
}) {
  const level = useMemo(
    () =>
      game === "zip" ? makeZipLevel(index, variant) : makeMaze(index, variant),
    [game, index, variant],
  );
  const [path, setPath] = useState<number[]>([]),
    [assisted, setAssisted] = useState(false),
    [seconds, setSeconds] = useState(0),
    [message, setMessage] = useState("");
  const trail = useRef<number[]>([]),
    done = useRef(false),
    moveCount = useRef(0),
    elapsed = useRef(0),
    tick = useRef(0),
    active = useRef(true);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height - insets.top - insets.bottom < 600;
  useEffect(() => {
    tick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (active.current || online) elapsed.current += now - tick.current;
      tick.current = now;
      setSeconds(elapsed.current);
    }, 1000);
    const sub = AppState.addEventListener("change", (s) => {
      const now = Date.now();
      if (active.current || online) elapsed.current += now - tick.current;
      tick.current = now;
      active.current = s === "active";
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [online]);
  const apply = (next: number[], hint = false, moves = 1) => {
    trail.current = next;
    setPath(next);
    moveCount.current += moves;

    setMessage("");
    const solved =
      level.kind === "zip" ? zipSolved(level, next) : mazeSolved(level, next);
    if (solved && !done.current) {
      done.current = true;
      onFinish({
        elapsedMs:
          elapsed.current + (active.current || online ? Date.now() - tick.current : 0),
        path: next,
        moves: moveCount.current,
        assisted: assisted || hint,
      });
    }
  };
  const onCells = (cells: number[]) => {
    if (done.current) return;
    let next = trail.current, moves = 0, blocked = false;
    for (const cell of cells) {
      if (cell === next.at(-1)) continue;
      if (next.length > 1 && cell === next.at(-2)) {
        next = next.slice(0, -1);
        moves++;
        continue;
      }
      const candidate = [...next, cell];
      const valid = level.kind === "zip"
        ? zipPrefixError(level, candidate) === null
        : mazeValid(level, candidate);
      if (!valid) { blocked = true; continue; }
      next = candidate;
      moves++;
      if (level.kind === "zip" ? next.length === level.size ** 2 : cell === level.end) break;
    }
    // Commit a coalesced input batch once, avoiding a separate render per cell.
    if (moves) { emitSound("move"); apply(next, false, moves); }
    else if (blocked) {
      emitSound("bump");
      setMessage(hi ? "रास्ता बदलें" : "Try another route");
    }
  };
  const onCell = (cell: number) => onCells([cell]);
  return (
    <View
      style={{
        flex: 1,
        padding: compact ? 12 : 16,
        gap: compact ? 8 : 12,
        justifyContent: "space-between",
        backgroundColor: theme.ground,
      }}
    >
      <View style={styles.between}>
        <Button label="‹" secondary onPress={onExit} />
        <Text style={styles.h2}>
          {game === "zip" ? "Number Trail" : "Maze Runner"}
        </Text>
        <Text style={styles.text}>{secondsText(seconds)}</Text>
      </View>
      <View style={styles.between}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Character game={game} story={Math.floor(index / 10)} size={28} />
          <Text numberOfLines={1} style={{ ...styles.text, maxWidth: 105 }}>
            {playerName}
          </Text>
        </View>
        <Text
          accessibilityLabel={`${gems} gems`}
          style={{ fontSize: 15, fontWeight: "900", color: theme.ink }}
        >
          💎 {gems}
        </Text>
      </View>
      <View style={styles.between}>
        <Text style={styles.label}>
          {hi ? "पज़ल" : "PUZZLE"} {index + 1}
        </Text>
        <Text style={styles.subtitle}>
          {level.kind === "maze"
            ? `${STORIES[Math.min(2, Math.floor(index / 10))].name} → ⌂`
            : `${path.length}/${level.size ** 2}`}
          {assisted ? " · ✦" : ""}
        </Text>
      </View>
      <View style={{ alignItems: "center", gap: compact ? 4 : 10 }}>
        <ZipBoard
          theme={theme}
          story={Math.floor(index / 10)}
          onCells={onCells}
          maze={game === "maze"}
          level={level}
          path={path}
          onCell={onCell}
          hi={hi}
          maxWidth={Math.max(
            180,
            Math.min(360, height - insets.top - insets.bottom - 340),
          )}
        />
        <Text style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>
          {game === "zip"
            ? hi
              ? "1 → 2 → 3 · पूरा बोर्ड भरें"
              : "1 → 2 → 3 · Fill every cell"
            : hi
              ? "अपने साथी को घर तक पहुँचाएँ"
              : "Guide your companion home"}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: C.coral, height: 20, fontSize: 12 }}
        >
          {message}
        </Text>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button
            label={hi ? "वापस" : "Undo"}
            secondary
            disabled={!path.length}
            onPress={() => apply(trail.current.slice(0, -1))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={hi ? "फिर से" : "Reset"}
            secondary
            onPress={() => {
              trail.current = [];
              setPath([]);
              setMessage("");
              moveCount.current++;
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={online ? "No hints" : "Hint · 💎5"}
            disabled={online || gems < 5}
            secondary
            onPress={() => {
              if (!onHint()) {
                setMessage("Need 5 gems");
                return;
              }
              emitSound("hint");
              setAssisted(true);
              const next =
                level.kind === "zip"
                  ? zipHint(level, trail.current)
                  : (() => {
                      let i = 0;
                      while (
                        i < trail.current.length &&
                        trail.current[i] === level.solution[i]
                      )
                        i++;
                      return level.solution.slice(0, i + 1);
                    })();
              apply(next, true);
            }}
          />
        </View>
      </View>
    </View>
  );
}
