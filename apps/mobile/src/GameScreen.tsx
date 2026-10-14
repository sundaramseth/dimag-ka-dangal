import React, { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import {
  Attempt,
  formatTime,
  Game,
  makeLevel,
  pathSolved,
  rotate,
  sumSolved,
  zipHint,
  zipPrefixError,
  zipSolved,
} from "./engine";
import { Button, C, styles, Txt } from "./ui";
import { ZipBoard } from "./ZipBoard";
export function GameScreen({
  game,
  index,
  variant,
  hi,
  name,
  reducedMotion,
  onFinish,
  onExit,
  tap,
}: {
  game: Game;
  index: number;
  variant: number;
  hi: boolean;
  name: string;
  reducedMotion: boolean;
  onFinish: (a: Pick<Attempt, "elapsedMs" | "moves" | "assisted">) => void;
  onExit: () => void;
  tap: () => void;
}) {
  const [level] = useState(() => makeLevel(game, index, variant));
  const [phase, setPhase] = useState<"ready" | "play" | "reveal">("ready");
  const [trail, setTrail] = useState<number[]>([]);
  const trailRef = useRef<number[]>([]);
  const changeTrail = (path: number[]) => {
    trailRef.current = path;
    setTrail(path);
  };
  const [tiles, setTiles] = useState(level.kind === "path" ? level.tiles : []);
  const [selected, setSelected] = useState(
    level.kind === "sum" ? level.values.map(() => false) : [],
  );
  const [moves, setMoves] = useState(0),
    [assisted, setAssisted] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [flash, setFlash] = useState(-1),
    [answer, setAnswer] = useState<number[]>([]),
    [message, setMessage] = useState("");
  const [history, setHistory] = useState<
    { tiles: number[]; selected: boolean[] }[]
  >([]);
  const start = useRef(0),
    done = useRef(false),
    timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };
  useEffect(() => () => clear(), []);
  useEffect(() => {
    if (phase === "ready") return;
    const id = setInterval(() => setElapsed(Date.now() - start.current), 100);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => {
    const s = AppState.addEventListener("change", (status) => {
      if (status !== "active" && phase !== "ready") setAssisted(true);
    });
    return () => s.remove();
  }, [phase]);
  function reveal() {
    if (level.kind !== "memory") return;
    clear();
    setPhase("reveal");
    setAnswer([]);
    setFlash(-1);
    level.sequence.forEach((cell, i) => {
      timeouts.current.push(
        setTimeout(() => setFlash(cell), 400 + i * (level.revealMs + 180)),
      );
      timeouts.current.push(
        setTimeout(
          () => setFlash(-1),
          400 + i * (level.revealMs + 180) + level.revealMs,
        ),
      );
    });
    timeouts.current.push(
      setTimeout(
        () => {
          setFlash(-1);
          setPhase("play");
        },
        500 + level.sequence.length * (level.revealMs + 180),
      ),
    );
  }
  function remember() {
    setHistory((h) =>
      [...h, { tiles: [...tiles], selected: [...selected] }].slice(-200),
    );
  }
  function undo() {
    if (level.kind === "zip") {
      changeTrail(trailRef.current.slice(0, -1));
      setMoves((m) => m + 1);
      setMessage("");
      return;
    }
    const last = history.at(-1);
    if (!last) return;
    setTiles(last.tiles);
    setSelected(last.selected);
    setHistory((h) => h.slice(0, -1));
    setMoves((m) => m + 1);
    setMessage("");
  }
  function restart() {
    clear();
    done.current = false;
    setTiles(level.kind === "path" ? level.tiles : []);
    setSelected(level.kind === "sum" ? level.values.map(() => false) : []);
    setMoves(0);
    setElapsed(0);
    setAssisted(false);
    setAnswer([]);
    setFlash(-1);
    setMessage("");
    setHistory([]);
    changeTrail([]);
    setPhase("ready");
  }
  function begin() {
    start.current = Date.now();
    setElapsed(0);
    if (level.kind === "memory") reveal();
    else setPhase("play");
  }
  function finish() {
    if (done.current) return;
    done.current = true;
    clear();
    tap();
    onFinish({
      elapsedMs: Math.max(1, Date.now() - start.current),
      moves,
      assisted,
    });
  }
  function check() {
    if (
      level.kind === "zip"
        ? zipSolved(level, trail)
        : level.kind === "path"
          ? pathSolved(level, tiles)
          : level.kind === "sum"
            ? sumSolved(level, selected)
            : false
    )
      finish();
    else
      setMessage(
        hi
          ? "अभी पूरा नहीं हुआ। फिर कोशिश करें।"
          : "Not quite there. Keep going!",
      );
  }
  function hint() {
    remember();
    setAssisted(true);
    setMessage(
      hi ? "यह assisted attempt है।" : "This is now an assisted attempt.",
    );
    if (level.kind === "zip") {
      changeTrail(zipHint(level, trailRef.current));
    } else if (level.kind === "path") {
      const i = tiles.findIndex((v, i) => v !== level.solution[i]);
      if (i >= 0)
        setTiles(tiles.map((v, k) => (k === i ? level.solution[i] : v)));
    } else if (level.kind === "sum") {
      const i = selected.findIndex((v, i) => v !== level.solution[i]);
      if (i >= 0)
        setSelected(selected.map((v, k) => (k === i ? level.solution[i] : v)));
    } else reveal();
  }
  const rule =
    game === "zip"
      ? hi
        ? "1 से शुरू करके numbers क्रम में जोड़ें। हर खाना एक बार भरें। केवल ऊपर/नीचे/बाएँ/दाएँ चलें और दीवार पार न करें।"
        : "Start at 1. Connect numbers in order, cover every cell once, move only up/down/left/right, and avoid walls."
      : game === "path"
        ? hi
          ? "हर tile को tap करके घुमाएँ। IN से OUT तक सभी tiles से जुड़ा रास्ता बनाएँ।"
          : "Tap to rotate tiles. Connect IN to OUT through every tile."
        : game === "sum"
          ? hi
            ? "Numbers चुनें। हर row और column का योग दिए target के बराबर करें।"
            : "Select numbers so every row and column matches its target."
          : hi
            ? "चमकते tiles का क्रम याद रखें। फिर उसी क्रम में tap करें।"
            : "Remember the glowing tiles. Tap them in the same order.";
  function trailCell(cell: number) {
    if (level.kind !== "zip" || phase !== "play") return;
    const current = trailRef.current;
    if (current.at(-1) === cell) return;
    if (current.length > 1 && current.at(-2) === cell) {
      changeTrail(current.slice(0, -1));
      setMoves((m) => m + 1);
      tap();
      return;
    }
    const next = [...current, cell],
      error = zipPrefixError(level, next);
    if (error) {
      const copy = {
        start: ["Start at number 1.", "Number 1 से शुरू करें।"],
        bounds: ["Stay on the board.", "Board के अंदर रहें।"],
        repeat: [
          "No overlaps. Use Undo to go back.",
          "दोबारा उसी खाने पर नहीं। Undo लें।",
        ],
        adjacent: [
          "Move to an adjacent cell, without diagonals.",
          "पास वाले खाने में चलें; diagonal नहीं।",
        ],
        wall: ["A wall blocks that move.", "इस रास्ते में दीवार है।"],
        order: [
          "Visit the next number in order.",
          "Numbers को क्रम में जोड़ें।",
        ],
        finish: [
          "Fill every cell before the final number.",
          "आखिरी number से पहले सभी खाने भरें।",
        ],
      };
      setMessage(copy[error][hi ? 1 : 0]);
      return;
    }
    tap();
    changeTrail(next);
    setMoves((m) => m + 1);
    setMessage("");
  }
  const glyph: Record<number, string> = {
    3: "└",
    6: "┌",
    12: "┐",
    9: "┘",
    5: "│",
    10: "─",
  };
  return (
    <View style={{ gap: 20 }}>
      <View style={styles.between}>
        <Button label={hi ? "← बाहर" : "← Leave"} secondary onPress={onExit} />
        <PillInfo text={`${hi ? "स्तर" : "LEVEL"} ${index + 1}`} />
      </View>
      <Text style={styles.title}>{name}</Text>
      <Txt muted>{rule}</Txt>
      {phase === "ready" ? (
        <View style={styles.card}>
          <Text style={{ fontSize: 48, textAlign: "center" }}>✦</Text>
          <Text style={styles.h2}>
            {hi ? "तैयार हैं?" : "Your next little victory."}
          </Text>
          <Txt muted>
            {hi
              ? "अपनी गति से खेलें। Hint लेने पर result assisted रहेगा।"
              : "Play at your pace. Hints mark the result as assisted."}
          </Txt>
          <Button label={hi ? "शुरू करें" : "Start puzzle"} onPress={begin} />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.stat}>
              <Txt muted>{hi ? "समय" : "TIME"}</Txt>
              <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
            </View>
            <View style={styles.stat}>
              <Txt muted>{hi ? "चालें" : "MOVES"}</Txt>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
          </View>
          <View style={[styles.card, { padding: 12 }]}>
            {level.kind === "zip" && (
              <ZipBoard level={level} path={trail} onCell={trailCell} hi={hi} />
            )}
            {level.kind === "path" && (
              <>
                <View style={styles.between}>
                  <Txt>IN →</Txt>
                  <Txt>→ OUT</Txt>
                </View>
                <View style={styles.board}>
                  {Array.from({ length: level.size }, (_, y) => (
                    <View key={y} style={[styles.row, { gap: 6 }]}>
                      {tiles
                        .slice(y * level.size, (y + 1) * level.size)
                        .map((mask, x) => (
                          <Pressable
                            key={x}
                            accessibilityRole="button"
                            accessibilityLabel={`Rotate tile ${y * level.size + x + 1}`}
                            onPress={() => {
                              tap();
                              remember();
                              setMessage("");
                              setMoves((m) => m + 1);
                              setTiles((t) =>
                                t.map((v, i) =>
                                  i === y * level.size + x ? rotate(v) : v,
                                ),
                              );
                            }}
                            style={styles.cell}
                          >
                            <Text
                              style={{
                                fontSize: 54,
                                lineHeight: 60,
                                color: C.teal,
                                fontWeight: "900",
                              }}
                            >
                              {glyph[mask]}
                            </Text>
                            {(y * level.size + x === level.start ||
                              y * level.size + x === level.end) && (
                              <Text
                                style={{
                                  position: "absolute",
                                  bottom: 3,
                                  fontSize: 9,
                                  color: C.gold,
                                  fontWeight: "800",
                                }}
                              >
                                {y * level.size + x === level.start
                                  ? "IN"
                                  : "OUT"}
                              </Text>
                            )}
                          </Pressable>
                        ))}
                    </View>
                  ))}
                </View>
              </>
            )}
            {level.kind === "sum" && (
              <View style={styles.board}>
                <View style={[styles.row, { gap: 6 }]}>
                  {level.cols.map((target, i) => (
                    <View key={i} style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: C.gold,
                          fontWeight: "800",
                          fontSize: 20,
                        }}
                      >
                        {target}
                      </Text>
                    </View>
                  ))}
                  <View style={{ width: 30 }} />
                </View>
                {level.rows.map((target, y) => (
                  <View key={y} style={[styles.row, { gap: 6 }]}>
                    {level.values
                      .slice(y * level.size, (y + 1) * level.size)
                      .map((v, x) => {
                        const i = y * level.size + x;
                        return (
                          <Pressable
                            key={x}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected[i] }}
                            accessibilityLabel={`Number ${v}, row ${y + 1}, column ${x + 1}`}
                            onPress={() => {
                              tap();
                              remember();
                              setMessage("");
                              setMoves((m) => m + 1);
                              setSelected((s) =>
                                s.map((n, k) => (k === i ? !n : n)),
                              );
                            }}
                            style={[
                              styles.cell,
                              selected[i] && { backgroundColor: C.teal },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cellText,
                                selected[i] && { color: C.bg },
                              ]}
                            >
                              {v}
                            </Text>
                          </Pressable>
                        );
                      })}
                    <Text
                      style={{
                        width: 30,
                        color: C.gold,
                        fontWeight: "800",
                        fontSize: 20,
                      }}
                    >
                      {target}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {level.kind === "memory" && (
              <>
                <Txt muted>
                  {phase === "reveal"
                    ? hi
                      ? "देखें और याद रखें…"
                      : "Watch and remember…"
                    : `${answer.length} / ${level.sequence.length}`}
                </Txt>
                <View style={styles.board}>
                  {[0, 1, 2].map((y) => (
                    <View key={y} style={[styles.row, { gap: 6 }]}>
                      {[0, 1, 2].map((x) => {
                        const cell = y * 3 + x;
                        return (
                          <Pressable
                            key={x}
                            accessibilityRole="button"
                            accessibilityLabel={`Memory tile ${cell + 1}`}
                            disabled={phase !== "play"}
                            onPress={() => {
                              tap();
                              setMoves((m) => m + 1);
                              if (cell !== level.sequence[answer.length]) {
                                setMessage(
                                  hi
                                    ? "गलत क्रम—फिर दिखाने के लिए Hint दबाएँ।"
                                    : "Different order. Try again or replay with Hint.",
                                );
                                setAnswer([]);
                                return;
                              }
                              const next = [...answer, cell];
                              setAnswer(next);
                              setMessage("");
                              if (next.length === level.sequence.length) {
                                done.current = true;
                                onFinish({
                                  elapsedMs: Date.now() - start.current,
                                  moves: moves + 1,
                                  assisted,
                                });
                              }
                            }}
                            style={[
                              styles.cell,
                              flash === cell && { backgroundColor: C.gold },
                              reducedMotion && { borderWidth: 2 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cellText,
                                { color: flash === cell ? C.bg : C.muted },
                              ]}
                            >
                              {cell + 1}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
          {!!message && <Txt>{message}</Txt>}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button
                secondary
                label={
                  game === "memory"
                    ? hi
                      ? "फिर देखें · Hint"
                      : "Replay · Hint"
                    : hi
                      ? "Hint लें"
                      : "Use hint"
                }
                disabled={phase === "reveal"}
                onPress={hint}
              />
            </View>
            {game !== "memory" && (
              <View style={{ flex: 1 }}>
                <Button
                  label={hi ? "जाँच करें" : "Check solution"}
                  onPress={check}
                />
              </View>
            )}
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button
                secondary
                label={hi ? "फिर शुरू करें" : "Restart"}
                onPress={restart}
              />
            </View>
            {game !== "memory" && (
              <View style={{ flex: 1 }}>
                <Button
                  secondary
                  disabled={
                    level.kind === "zip" ? !trail.length : !history.length
                  }
                  label={hi ? "पिछली चाल" : "Undo"}
                  onPress={undo}
                />
              </View>
            )}
          </View>
          {assisted && (
            <Txt muted>{hi ? "✦ Assisted attempt" : "✦ Assisted attempt"}</Txt>
          )}
        </>
      )}
    </View>
  );
}
function PillInfo({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}
