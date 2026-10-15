import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Attempt, compareAttempts, formatTime } from "./engine";
import { points, PUZZLES, streak, unlocked } from "./engine/journey";
import { LocalState } from "./storage/types";
import { loadState, saveState } from "./storage";
import { ParkEdge } from "./Scenery";
import { ActiveGame, GameScreen } from "./GameScreen";
import { Button, C, styles } from "./ui";
type Round = {
  game: ActiveGame;
  index: number;
  variant: number;
  name: string;
  profileId: string;
  sessionId?: string;
};
type Battle = {
  id: string;
  seed: number;
  players: string[];
  turn: number;
  results: Attempt[];
};
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const names = { zip: "Number Trail", maze: "Maze Runner" };
export default function DangalApp() {
  const [state, setState] = useState<LocalState | null>(null),
    [game, setGame] = useState<ActiveGame>("zip"),
    [round, setRound] = useState<Round | null>(null),
    [result, setResult] = useState<Attempt | null>(null),
    [panel, setPanel] = useState<"settings" | "battle" | null>(null),
    [battle, setBattle] = useState<Battle | null>(null),
    [players, setPlayers] = useState(["Player 1", "Player 2"]),
    [error, setError] = useState("");
  const writing = useRef(Promise.resolve()),
    [scale] = useState(() => new Animated.Value(0.9)),
    [nodeGlow] = useState(() => new Animated.Value(1));
  useEffect(() => {
    loadState()
      .then(setState)
      .catch(() => setError("Storage unavailable. Restart the app."));
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (panel) {
        setPanel(null);
        return true;
      }
      if (round || result) {
        setRound(null);
        setResult(null);
        setBattle(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [panel, round, result]);
  useEffect(() => {
    if (!result) return;
    scale.setValue(state?.settings.reducedMotion ? 1 : 0.9);
    if (!state?.settings.reducedMotion)
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
  }, [result, scale, state?.settings.reducedMotion]);
  useEffect(() => {
    if (round || result || state?.settings.reducedMotion) return;
    nodeGlow.setValue(0.45);
    const animation = Animated.timing(nodeGlow, {
      toValue: 1,
      duration: 550,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [round, result, game, nodeGlow, state?.settings.reducedMotion]);
  const update = (next: LocalState) => {
    setState(next);
    writing.current = writing.current
      .catch(() => {})
      .then(() => saveState(next))
      .catch(() =>
        setError("Could not save. Please keep this app open and retry."),
      );
  };
  if (!state)
    return (
      <SafeAreaView style={styles.root}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {error ? (
            <Text style={styles.text}>{error}</Text>
          ) : (
            <ActivityIndicator color={C.teal} />
          )}
        </View>
      </SafeAreaView>
    );
  const hi = state.settings.language === "hi",
    t = (en: string, hn: string) => (hi ? hn : en);
  const current =
    state.profiles.find((p) => p.id === state.settings.activeProfileId) ||
    state.profiles[0];
  const next = unlocked(state.attempts, current.id, game);
  const activeAttempts = state.attempts.filter(
    (a) => a.profileId === current.id && a.game === game && !a.sessionId,
  );
  const completed = new Set(activeAttempts.map((a) => a.level));
  const total = Math.round(
    [...new Set(activeAttempts.map((a) => a.level))].reduce(
      (sum, i) =>
        sum +
        Math.max(...activeAttempts.filter((a) => a.level === i).map(points)),
      0,
    ),
  );
  const tap = () => {
    if (state.settings.haptics && Platform.OS !== "web")
      Haptics.selectionAsync().catch(() => {});
  };
  const start = (index: number) => {
    tap();
    setBattle(null);
    setResult(null);
    setRound({
      game,
      index,
      variant: 0,
      name: current.name,
      profileId: current.id,
    });
  };
  const share = async () => {
    try {
      await Share.share({
        message: `Dimag Ka Dangal — ${names[game]}${result ? ` · Puzzle ${result.level + 1} · ${formatTime(result.elapsedMs)} · ${Math.round(points(result))} points` : ""}\nTry the Android test app and send your review.\nhttps://github.com/sundaramseth/dimag-ka-dangal/actions`,
      });
    } catch {
      setError(t("Share unavailable.", "शेयर नहीं हुआ।"));
    }
  };
  const finish = (stats: Pick<Attempt, "elapsedMs" | "moves" | "assisted">) => {
    if (!round) return;
    const a: Attempt = {
      ...stats,
      id: uid(),
      profileId: round.profileId,
      name: round.name,
      game: round.game,
      level: round.index,
      variant: round.variant,
      sessionId: round.sessionId,
      createdAt: new Date().toISOString(),
    };
    update({ ...state, attempts: [a, ...state.attempts] });
    if (battle) setBattle({ ...battle, results: [...battle.results, a] });
    setRound(null);
    setResult(a);
    tap();
  };
  const startBattle = () => {
    const valid = players.map((p) => p.trim());
    if (
      valid.some((p) => !p) ||
      new Set(valid.map((p) => p.toLowerCase())).size !== valid.length
    ) {
      setError(t("Use different player names.", "अलग नाम दें।"));
      return;
    }
    const b = {
      id: uid(),
      seed: 1 + Math.floor(Math.random() * 999999),
      players: valid,
      turn: 0,
      results: [],
    };
    setBattle(b);
    setResult(null);
    setPanel(null);
    setRound({
      game,
      index: next,
      variant: b.seed,
      name: valid[0],
      profileId: `battle-${b.id}-0`,
      sessionId: b.id,
    });
  };
  const nextTurn = () => {
    if (!battle || !result) return;
    const turn = battle.turn + 1;
    setBattle({ ...battle, turn });
    setResult(null);
    setRound({
      game: result.game as ActiveGame,
      index: result.level,
      variant: battle.seed,
      name: battle.players[turn],
      profileId: `battle-${battle.id}-${turn}`,
      sessionId: battle.id,
    });
  };
  const settings = state.settings;
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.root}
    >
      <StatusBar style="dark" />
      {round ? (
        <GameScreen
          key={`${round.game}-${round.index}-${round.profileId}`}
          game={round.game}
          index={round.index}
          variant={round.variant}
          hi={hi}
          onFinish={finish}
          onExit={() => {
            setRound(null);
            setBattle(null);
          }}
        />
      ) : result ? (
        <View
          style={{ flex: 1, padding: 24, justifyContent: "center", gap: 20 }}
        >
          <Animated.View
            style={[
              styles.card,
              { alignItems: "center", transform: [{ scale }] },
            ]}
          >
            <Text style={{ color: C.gold, fontSize: 52 }}>
              ★ {result.assisted ? "☆" : "★"}
            </Text>
            <Text style={styles.title}>{t("Puzzle cleared", "पज़ल पूरा")}</Text>
            <Text style={styles.text}>
              {result.name} · {names[result.game as ActiveGame]}
            </Text>
            <Text style={{ fontSize: 42, fontWeight: "900", color: C.ink }}>
              {Math.round(points(result))}
            </Text>
            <Text style={styles.subtitle}>
              {formatTime(result.elapsedMs)} · {result.moves}{" "}
              {t("moves", "चालें")}
              {result.assisted ? " · Hint" : ""}
            </Text>
          </Animated.View>
          {battle && (
            <View style={styles.card}>
              {[...battle.results].sort(compareAttempts).map((a, i) => (
                <View key={a.id} style={styles.between}>
                  <Text style={styles.text}>
                    {i === 0 ? "♛" : i + 1} {a.name}
                  </Text>
                  <Text style={styles.text}>
                    {formatTime(a.elapsedMs)}
                    {a.assisted ? " ✦" : ""}
                  </Text>
                </View>
              ))}
              <Text style={styles.subtitle}>
                {battle.results.length === battle.players.length
                  ? t("Final standings", "अंतिम परिणाम")
                  : t("Same puzzle · Pass the phone", "एक पज़ल · फोन पास करें")}
              </Text>
            </View>
          )}
          {battle && battle.turn + 1 < battle.players.length ? (
            <Button
              label={`${t("Next", "अगला")}: ${battle.players[battle.turn + 1]}`}
              onPress={nextTurn}
            />
          ) : !battle && result.level + 1 < PUZZLES ? (
            <Button
              label={t("Next puzzle →", "अगला पज़ल →")}
              onPress={() => start(result.level + 1)}
            />
          ) : null}
          <Button
            label={t("Share score", "स्कोर शेयर")}
            secondary
            onPress={share}
          />
          <Button
            label={t("Journey", "यात्रा")}
            secondary
            onPress={() => {
              setResult(null);
              setBattle(null);
            }}
          />
        </View>
      ) : (
        <>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 14,
              gap: 16,
            }}
          >
            <View style={styles.between}>
              <View>
                <Text style={styles.label}>DIMAG KA DANGAL</Text>
                <Text
                  style={{
                    color: C.ink,
                    fontSize: 23,
                    fontWeight: "900",
                    marginTop: 6,
                  }}
                >
                  {t("Your journey", "आपकी यात्रा")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => setPanel("settings")}
                style={styles.chip}
              >
                <Text style={{ fontSize: 24, color: C.ink }}>⚙</Text>
              </Pressable>
            </View>
            <View style={styles.row}>
              {(["zip", "maze"] as ActiveGame[]).map((g) => (
                <Pressable
                  key={g}
                  accessibilityRole="button"
                  accessibilityState={{ selected: game === g }}
                  onPress={() => {
                    setGame(g);
                    tap();
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 18,
                    padding: 14,
                    backgroundColor: game === g ? C.teal : C.panel2,
                  }}
                >
                  <Text
                    style={{
                      color: C.ink,
                      fontWeight: "900",
                      textAlign: "center",
                    }}
                  >
                    {g === "zip" ? "① → ②" : "▥"} {names[g]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.between}>
              <Text style={styles.text}>★ {total}</Text>
              <Text style={styles.text}>
                ♨ {streak(state.attempts, current.id)}
              </Text>
              <Text style={styles.subtitle}>
                {completed.size}/{PUZZLES} ✓
              </Text>
            </View>
          </View>
          <ScrollView
            bounces={false}
            overScrollMode="never"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View
              style={{
                height: PUZZLES * 100 + 30,
                alignSelf: "center",
                width: "100%",
                maxWidth: 420,
              }}
            >
              <ParkEdge />
              {Array.from({ length: PUZZLES }, (_, i) => {
                const x = [0, 65, 85, 45, -35, -80, -65][i % 7],
                  previous = [0, 65, 85, 45, -35, -80, -65][(i - 1) % 7] || 0,
                  locked = i > next,
                  solved = completed.has(i);
                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: i * 100 - 38,
                          left: "50%",
                          marginLeft: (x + previous) / 2 - 3,
                          width: 6,
                          height: 70,
                          backgroundColor: solved ? C.teal : C.line,
                          transform: [
                            {
                              rotate: `${(-Math.atan2(x - previous, 100) * 180) / Math.PI}deg`,
                            },
                          ],
                        }}
                      />
                    )}
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel={`Puzzle ${i + 1}${locked ? ", locked" : solved ? ", completed" : ", play"}`}
                      accessibilityState={{ disabled: locked }}
                      disabled={locked}
                      onPress={() => start(i)}
                      style={{
                        opacity: i === next ? nodeGlow : 1,
                        position: "absolute",
                        top: i * 100 + 10,
                        left: "50%",
                        marginLeft: x - 33,
                        width: 66,
                        height: 66,
                        borderRadius: 26,
                        backgroundColor: locked
                          ? C.panel2
                          : solved
                            ? "#2A655F"
                            : C.teal,
                        borderWidth: i === next ? 4 : 2,
                        borderColor:
                          i === next ? C.gold : locked ? C.line : "#D1E9AD",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: locked ? undefined : "0 6px 0 #648352",
                      }}
                    >
                      <Text
                        style={{
                          color: locked ? C.muted : solved ? C.gold : C.ink,
                          fontSize: 23,
                          fontWeight: "900",
                        }}
                      >
                        {locked ? "·" : solved ? "★" : i + 1}
                      </Text>
                    </AnimatedPressable>
                    {i % 6 === 0 && (
                      <Text
                        style={{
                          position: "absolute",
                          top: i * 100 + 84,
                          alignSelf: "center",
                          color: C.muted,
                          fontSize: 10,
                          letterSpacing: 2,
                        }}
                      >
                        {t("CHAPTER", "अध्याय")} {Math.floor(i / 6) + 1}
                      </Text>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </ScrollView>
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderColor: C.line,
              backgroundColor: C.panel,
              gap: 8,
            }}
          >
            <Button
              label={`${t("Play", "खेलें")} · ${t("Puzzle", "पज़ल")} ${next + 1} →`}
              onPress={() => start(next)}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("⚔ Battle", "⚔ बैटल")}
                  secondary
                  onPress={() => setPanel("battle")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("↗ Invite", "↗ बुलाएँ")}
                  secondary
                  onPress={share}
                />
              </View>
            </View>
          </View>
        </>
      )}
      <Modal
        visible={panel !== null}
        transparent
        animationType={settings.reducedMotion ? "none" : "fade"}
        onRequestClose={() => setPanel(null)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#000A",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          >
            <View style={styles.card}>
              <View style={styles.between}>
                <Text style={styles.h2}>
                  {panel === "settings"
                    ? t("Settings", "सेटिंग्स")
                    : t("Local battle", "लोकल बैटल")}
                </Text>
                <Button label="×" secondary onPress={() => setPanel(null)} />
              </View>
              {panel === "settings" ? (
                <>
                  <TextInput
                    accessibilityLabel="Player name"
                    placeholder="Player name"
                    placeholderTextColor={C.muted}
                    value={current.name}
                    maxLength={24}
                    onChangeText={(name) =>
                      update({
                        ...state,
                        profiles: state.profiles.map((p) =>
                          p.id === current.id ? { ...p, name } : p,
                        ),
                      })
                    }
                    style={styles.input}
                  />
                  {[
                    ["Haptics", "haptics"],
                    ["Reduce motion", "reducedMotion"],
                  ].map(([label, key]) => (
                    <View key={key} style={styles.between}>
                      <Text style={styles.text}>{label}</Text>
                      <Switch
                        accessibilityLabel={label}
                        value={settings[key as "haptics" | "reducedMotion"]}
                        onValueChange={(v) =>
                          update({
                            ...state,
                            settings: { ...settings, [key]: v },
                          })
                        }
                        trackColor={{ true: C.teal }}
                      />
                    </View>
                  ))}
                  <Button
                    label={hi ? "Language · English" : "भाषा · हिन्दी"}
                    secondary
                    onPress={() =>
                      update({
                        ...state,
                        settings: { ...settings, language: hi ? "en" : "hi" },
                      })
                    }
                  />
                  <Button
                    label={t("Share for review", "रिव्यू के लिए शेयर")}
                    secondary
                    onPress={share}
                  />
                  <Text style={styles.subtitle}>
                    v0.3.0 ·{" "}
                    {t(
                      "Progress saved on this phone",
                      "प्रगति इस फोन पर सेव है",
                    )}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.subtitle}>
                    {t(
                      "2–4 players · one phone · same puzzle",
                      "2–4 खिलाड़ी · एक फोन · एक पज़ल",
                    )}
                  </Text>
                  {players.map((name, i) => (
                    <TextInput
                      key={i}
                      accessibilityLabel={`Battle player ${i + 1}`}
                      style={styles.input}
                      value={name}
                      maxLength={24}
                      onChangeText={(v) =>
                        setPlayers(players.map((p, j) => (i === j ? v : p)))
                      }
                    />
                  ))}
                  <View style={styles.row}>
                    <Button
                      label="+"
                      secondary
                      disabled={players.length === 4}
                      onPress={() =>
                        setPlayers([...players, `Player ${players.length + 1}`])
                      }
                    />
                    <Button
                      label="−"
                      secondary
                      disabled={players.length === 2}
                      onPress={() => setPlayers(players.slice(0, -1))}
                    />
                  </View>
                  <Button
                    label={t("Start battle", "बैटल शुरू")}
                    onPress={startBattle}
                  />
                  <Text style={styles.subtitle}>
                    {t(
                      "Online friends are not connected yet.",
                      "ऑनलाइन फ्रेंड्स अभी जुड़े नहीं हैं।",
                    )}
                  </Text>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {!!error && (
        <View
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            right: 20,
            backgroundColor: C.panel2,
            padding: 16,
            borderRadius: 16,
          }}
        >
          <Text style={styles.text}>{error}</Text>
          <Button label="OK" onPress={() => setError("")} />
        </View>
      )}
    </SafeAreaView>
  );
}
