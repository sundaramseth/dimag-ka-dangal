import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Text, View, useWindowDimensions } from "react-native";
import {
  Attempt,
  formatTime,
  makeZipLevel,
  zipHint,
  zipPrefixError,
  zipSolved,
} from "./engine";
import { makeMaze, mazeSolved, mazeValid } from "./engine/maze";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tree } from "./Scenery";
import { ZipBoard } from "./ZipBoard";
import { Button, C, styles } from "./ui";
export type ActiveGame = "zip" | "maze";
export function GameScreen({
  game,
  index,
  variant,
  hi,
  onExit,
  onFinish,
}: {
  game: ActiveGame;
  index: number;
  variant: number;
  hi: boolean;
  onExit: () => void;
  onFinish: (stats: Pick<Attempt, "elapsedMs" | "moves" | "assisted">) => void;
}) {
  const level = useMemo(
    () =>
      game === "zip" ? makeZipLevel(index, variant) : makeMaze(index, variant),
    [game, index, variant],
  );
  const [path, setPath] = useState<number[]>([]),
    [moves, setMoves] = useState(0),
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
  useEffect(() => {
    tick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (active.current) elapsed.current += now - tick.current;
      tick.current = now;
      setSeconds(elapsed.current);
    }, 1000);
    const sub = AppState.addEventListener("change", (s) => {
      const now = Date.now();
      if (active.current) elapsed.current += now - tick.current;
      tick.current = now;
      active.current = s === "active";
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  const apply = (next: number[], hint = false) => {
    trail.current = next;
    setPath(next);
    moveCount.current++;
    setMoves(moveCount.current);
    setMessage("");
    const solved =
      level.kind === "zip" ? zipSolved(level, next) : mazeSolved(level, next);
    if (solved && !done.current) {
      done.current = true;
      onFinish({
        elapsedMs:
          elapsed.current + (active.current ? Date.now() - tick.current : 0),
        moves: moveCount.current,
        assisted: assisted || hint,
      });
    }
  };
  const onCell = (cell: number) => {
    if (done.current || cell === trail.current.at(-1)) return;
    if (trail.current.length > 1 && cell === trail.current.at(-2)) {
      apply(trail.current.slice(0, -1));
      return;
    }
    const next = [...trail.current, cell];
    const valid =
      level.kind === "zip"
        ? zipPrefixError(level, next) === null
        : mazeValid(level, next);
    if (valid) apply(next);
    else setMessage(hi ? "रास्ता बदलें" : "Try another route");
  };
  return (
    <View
      style={{ flex: 1, padding: 16, gap: 12, justifyContent: "space-between" }}
    >
      <View style={styles.between}>
        <Button label="‹" secondary onPress={onExit} />
        <Text style={styles.h2}>
          {game === "zip" ? "Number Trail" : "Maze Runner"}
        </Text>
        <Text style={styles.text}>{formatTime(seconds)}</Text>
      </View>
      <View style={styles.between}>
        <Text style={styles.label}>
          {hi ? "पज़ल" : "PUZZLE"} {index + 1}
        </Text>
        <Text style={styles.subtitle}>
          {moves} {hi ? "चालें" : "moves"}
          {assisted ? " · ✦" : ""}
        </Text>
      </View>
      <View style={{ alignItems: "center", gap: 10 }}>
        {game === "maze" && (
          <View style={{ flexDirection: "row", gap: 30 }}>
            <Tree small />
            <Tree small />
            <Tree small />
            <Tree small />
            <Tree small />
          </View>
        )}
        <ZipBoard
          maze={game === "maze"}
          level={level}
          path={path}
          onCell={onCell}
          hi={hi}
          maxWidth={Math.max(
            180,
            Math.min(360, height - insets.top - insets.bottom - 310),
          )}
        />
        <Text style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>
          {game === "zip"
            ? hi
              ? "1 → 2 → 3 · पूरा बोर्ड भरें"
              : "1 → 2 → 3 · Fill every cell"
            : hi
              ? "Find the way home"
              : "घर तक रास्ता खोजें"}
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
              setMoves(moveCount.current);
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Hint ✦"
            secondary
            onPress={() => {
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
