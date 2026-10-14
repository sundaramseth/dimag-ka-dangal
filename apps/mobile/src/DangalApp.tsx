import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import {
  Attempt,
  compareAttempts,
  formatTime,
  Game,
  levelDifficulty,
} from "./engine";
import { LocalState, Profile } from "./storage/types";
import { loadState, saveState } from "./storage";
import { Button, C, Pill, styles, Txt } from "./ui";
import { GameScreen } from "./GameScreen";
type Tab = "play" | "family" | "scores" | "profile";
type Round = {
  game: Game;
  level: number;
  variant: number;
  profile: Profile;
  sessionId?: string;
};
type Family = {
  id: string;
  players: Profile[];
  turn: number;
  game: Game;
  level: number;
  results: Attempt[];
  seed: number;
};
const games: Game[] = ["path", "sum", "memory"];
const names = {
  en: { path: "Rang Raasta", sum: "Jod Jamao", memory: "Yaadon Ki Baazi" },
  hi: { path: "रंग रास्ता", sum: "जोड़ जमाओ", memory: "यादों की बाज़ी" },
};
const icons = { path: "⌁", sum: "+", memory: "▦" };
const accents = { path: C.teal, sum: C.coral, memory: C.gold };
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export default function DangalApp() {
  const [state, setState] = useState<LocalState | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState<Tab>("play"),
    [round, setRound] = useState<Round | null>(null),
    [result, setResult] = useState<Attempt | null>(null),
    [family, setFamily] = useState<Family | null>(null),
    [selectedGame, setSelectedGame] = useState<Game>("path"),
    [index, setIndex] = useState(0),
    [players, setPlayers] = useState<string[]>(["Player 1", "Player 2"]),
    [profileName, setProfileName] = useState(""),
    [feedback, setFeedback] = useState(""),
    [rating, setRating] = useState(5),
    [saved, setSaved] = useState(false);
  const writing = useRef(Promise.resolve());
  useEffect(() => {
    loadState()
      .then(setState)
      .catch(() =>
        setError("Local storage could not be opened. Reload and try again."),
      );
  }, []);
  const update = (next: LocalState) => {
    setState(next);
    writing.current = writing.current
      .catch(() => {})
      .then(() => saveState(next))
      .catch(() =>
        setError(
          "Could not save to this device. Your session is still visible; export results before closing.",
        ),
      );
  };
  if (!state)
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.content}>
          {error ? (
            <>
              <Txt>{error}</Txt>
              <Button
                label="Retry"
                onPress={() => {
                  setError("");
                  loadState()
                    .then(setState)
                    .catch(() => setError("Storage unavailable."));
                }}
              />
            </>
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
  const tap = () => {
    if (state.settings.haptics && Platform.OS !== "web")
      Haptics.selectionAsync().catch(() => {});
  };
  const select = (next: Tab) => {
    tap();
    setTab(next);
    setSaved(false);
  };
  const finish = (stats: Pick<Attempt, "elapsedMs" | "moves" | "assisted">) => {
    if (!round) return;
    const attempt: Attempt = {
      ...stats,
      id: uid(),
      profileId: round.profile.id,
      name: round.profile.name,
      game: round.game,
      level: round.level,
      variant: round.variant,
      sessionId: round.sessionId,
      createdAt: new Date().toISOString(),
    };
    update({ ...state, attempts: [attempt, ...state.attempts].slice(0, 2000) });
    if (family) setFamily({ ...family, results: [...family.results, attempt] });
    setResult(attempt);
    setRound(null);
  };
  const startSolo = () => {
    setFamily(null);
    setResult(null);
    setRound({
      game: selectedGame,
      level: index,
      variant: 0,
      profile: current,
    });
  };
  const startFamily = () => {
    const valid = players.map((n) => n.trim()).filter(Boolean);
    if (
      valid.length < 2 ||
      new Set(valid.map((n) => n.toLowerCase())).size !== valid.length
    ) {
      setError(
        t("Use 2–4 different player names.", "2–4 अलग player names दें।"),
      );
      return;
    }
    const id = uid();
    const seed = Math.floor(Math.random() * 10000);
    const members = valid.map((name, i) => ({
      id: `${id}-${i}`,
      name,
      avatar: i,
    }));
    const f: Family = {
      id,
      players: members,
      turn: 0,
      game: selectedGame,
      level: index,
      results: [],
      seed,
    };
    setFamily(f);
    setResult(null);
    setRound({
      game: f.game,
      level: f.level,
      variant: seed,
      profile: members[0],
      sessionId: id,
    });
  };
  const nextTurn = () => {
    if (!family) return;
    const turn = family.turn + 1;
    if (turn >= family.players.length) return;
    setFamily({ ...family, turn });
    setResult(null);
    setRound({
      game: family.game,
      level: family.level,
      variant: family.seed + turn,
      profile: family.players[turn],
      sessionId: family.id,
    });
  };
  const share = async (message: string) => {
    try {
      await Share.share({ message });
    } catch {
      setError(
        t(
          "Sharing unavailable. Try again on your phone.",
          "Share नहीं हुआ। अपने phone पर फिर कोशिश करें।",
        ),
      );
    }
  };
  const selector = (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        {games.map((g) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedGame === g }}
            key={g}
            onPress={() => {
              tap();
              setSelectedGame(g);
            }}
            style={[
              styles.chip,
              {
                flex: 1,
                borderWidth: 1,
                borderColor: selectedGame === g ? accents[g] : C.line,
              },
            ]}
          >
            <Text
              style={{ textAlign: "center", color: accents[g], fontSize: 24 }}
            >
              {icons[g]}
            </Text>
            <Text
              style={{
                textAlign: "center",
                color: C.ink,
                fontSize: 11,
                marginTop: 6,
              }}
            >
              {names[hi ? "hi" : "en"][g]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Txt muted>
        {t("Choose your level", "अपना स्तर चुनें")} · {levelDifficulty(index)}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Level ${i + 1}`}
            accessibilityState={{ selected: index === i }}
            onPress={() => setIndex(i)}
            style={[
              styles.chip,
              {
                minWidth: 46,
                minHeight: 46,
                justifyContent: "center",
                backgroundColor: index === i ? C.teal : C.panel2,
              },
            ]}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "800",
                color: index === i ? C.bg : C.ink,
              }}
            >
              {i + 1}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.between}>
          <Text style={styles.label}>DIMAG KA DANGAL</Text>
          <Pill text={t("OFFLINE ALPHA", "ऑफलाइन अल्फा")} />
        </View>
        {!!error && (
          <View style={styles.card}>
            <Txt>{error}</Txt>
            <Button
              label={t("Dismiss", "बंद करें")}
              secondary
              onPress={() => setError("")}
            />
          </View>
        )}
        {round ? (
          <View style={{ gap: 14 }}>
            <Pill
              text={`${round.profile.name}${round.sessionId ? ` · ${t("FAMILY TURN", "फैमिली टर्न")}` : ""}`}
            />
            <GameScreen
              key={`${round.profile.id}-${round.game}-${round.level}-${round.variant}`}
              game={round.game}
              index={round.level}
              variant={round.variant}
              name={names[hi ? "hi" : "en"][round.game]}
              hi={hi}
              reducedMotion={state.settings.reducedMotion}
              tap={tap}
              onFinish={finish}
              onExit={() => {
                setRound(null);
                setFamily(null);
                setTab("play");
              }}
            />
          </View>
        ) : result ? (
          <>
            <View
              style={[
                styles.card,
                { alignItems: "center", paddingVertical: 32 },
              ]}
            >
              <Text style={{ fontSize: 58, color: C.gold }}>✦</Text>
              <Pill
                text={
                  result.assisted
                    ? t("ASSISTED SOLVE", "HINT के साथ")
                    : t("CLEAN SOLVE", "बिना HINT")
                }
              />
              <Text style={styles.title}>{t("Nicely done!", "शानदार!")}</Text>
              <Txt>
                {result.name} · {names[hi ? "hi" : "en"][result.game]}
              </Txt>
              <Text style={{ fontSize: 56, color: C.ink, fontWeight: "800" }}>
                {formatTime(result.elapsedMs)}
              </Text>
              <Txt muted>
                {result.moves} {t("moves", "चालें")} ·{" "}
                {t("saved on this device", "इस phone पर save")}
              </Txt>
            </View>
            {family && (
              <View style={styles.card}>
                <Text style={styles.h2}>
                  {t("Family standings", "फैमिली स्कोर")}
                </Text>
                {[...family.results].sort(compareAttempts).map((a, i) => (
                  <View key={a.id} style={styles.between}>
                    <Txt>
                      {i + 1}. {a.name}
                      {a.assisted ? " ✦" : ""}
                    </Txt>
                    <Txt>{formatTime(a.elapsedMs)}</Txt>
                  </View>
                ))}
                <Txt muted>
                  {t(
                    "Fresh boards each turn. Casual family play; hints rank after clean solves.",
                    "हर turn पर नया board। बिना hint वाले results पहले।",
                  )}
                </Txt>
              </View>
            )}
            {family && family.turn + 1 < family.players.length ? (
              <Button
                label={`${t("Pass phone to", "फोन दें")} ${family.players[family.turn + 1].name} →`}
                onPress={nextTurn}
              />
            ) : (
              <Button
                label={t("Play again", "फिर खेलें")}
                onPress={() => {
                  if (family) {
                    setResult(null);
                    startFamily();
                  } else startSolo();
                }}
              />
            )}
            {!family && index < 9 && (
              <Button
                label={t("Next level →", "अगला स्तर →")}
                onPress={() => {
                  const next = index + 1;
                  setIndex(next);
                  setResult(null);
                  setRound({
                    game: selectedGame,
                    level: next,
                    variant: 0,
                    profile: current,
                  });
                }}
              />
            )}
            <Button
              label={t("Share result", "Result शेयर करें")}
              secondary
              onPress={() =>
                share(
                  `Dimag Ka Dangal: ${result.name} solved ${names.en[result.game]} level ${result.level + 1} in ${formatTime(result.elapsedMs)} (${result.assisted ? "assisted" : "clean"}). Offline alpha — can you beat it?`,
                )
              }
            />
            <Button
              label={t("Back home", "होम पर जाएँ")}
              secondary
              onPress={() => {
                setResult(null);
                setFamily(null);
                setTab("play");
              }}
            />
          </>
        ) : tab === "play" ? (
          <>
            <Text style={styles.title}>
              {t(
                "A little play.\nA big smile.",
                "थोड़ा खेलें।\nखूब मुस्कुराएँ।",
              )}
            </Text>
            <Txt muted>
              {t(
                `Hey ${current.name}. Your next challenge is waiting.`,
                `${current.name}, अगली चुनौती आपका इंतजार कर रही है।`,
              )}
            </Txt>
            <View
              style={[
                styles.card,
                { backgroundColor: "#173D43", borderColor: "#28635D" },
              ]}
            >
              <Pill text={t("NO LOGIN · NO ADS", "न LOGIN · न ADS")} />
              <Text style={[styles.h2, { fontSize: 27 }]}>
                {t("Your brain. Your pace.", "आपका खेल। आपकी गति।")}
              </Text>
              <Txt>
                {t(
                  "Three pocket-sized puzzles. Play alone or pass the phone around.",
                  "तीन छोटे मजेदार puzzles। अकेले खेलें या परिवार के साथ।",
                )}
              </Txt>
              <Button
                label={t("Family Battle →", "Family Battle →")}
                onPress={() => select("family")}
              />
            </View>
            <Text style={styles.h2}>
              {t("Pick your challenge", "अपनी चुनौती चुनें")}
            </Text>
            {selector}
            <Button label={t("Let’s play →", "खेलें →")} onPress={startSolo} />
            <View style={styles.row}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{state.attempts.length}</Text>
                <Txt muted>{t("solves on device", "फोन के solves")}</Txt>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>30</Text>
                <Txt muted>{t("starter levels", "शुरुआती levels")}</Txt>
              </View>
            </View>
          </>
        ) : tab === "family" ? (
          <>
            <Text style={styles.title}>
              {t("One phone.\nEveryone plays.", "एक फोन।\nसबका मुकाबला।")}
            </Text>
            <Txt muted>
              {t(
                "2–4 players, fresh puzzles, one happy family.",
                "2–4 खिलाड़ी, नए puzzles और मजेदार मुकाबला।",
              )}
            </Txt>
            <View style={styles.card}>
              {players.map((name, i) => (
                <View key={i} style={styles.row}>
                  <Text style={{ color: C.gold, fontWeight: "800" }}>
                    {i + 1}
                  </Text>
                  <TextInput
                    accessibilityLabel={`Player ${i + 1} name`}
                    value={name}
                    maxLength={24}
                    onChangeText={(text) =>
                      setPlayers((p) => p.map((v, k) => (k === i ? text : v)))
                    }
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t("Player name", "खिलाड़ी का नाम")}
                    placeholderTextColor={C.muted}
                  />
                </View>
              ))}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t("+ Add player", "+ खिलाड़ी जोड़ें")}
                    secondary
                    disabled={players.length >= 4}
                    onPress={() =>
                      setPlayers([...players, `Player ${players.length + 1}`])
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t("Remove last", "अंतिम हटाएँ")}
                    secondary
                    disabled={players.length <= 2}
                    onPress={() => setPlayers(players.slice(0, -1))}
                  />
                </View>
              </View>
            </View>
            {selector}
            <Button
              label={t("Start Family Battle →", "मुकाबला शुरू →")}
              onPress={startFamily}
            />
            <Txt muted>
              {t(
                "This is same-device play. Online friends and public rankings arrive in later phases.",
                "यह एक phone का मुकाबला है। Online friends और public ranking अगले phases में आएँगे।",
              )}
            </Txt>
          </>
        ) : tab === "scores" ? (
          <>
            <Text style={styles.title}>
              {t("Small wins.\nWorth keeping.", "आपकी जीत।\nआपका रिकॉर्ड।")}
            </Text>
            <Pill text={t("THIS DEVICE ONLY", "केवल इस फोन पर")} />
            <Txt muted>
              {t(
                "Personal records and family results. Online ranking is not connected yet.",
                "अपने और परिवार के results। Online ranking अभी नहीं जुड़ी है।",
              )}
            </Txt>
            {state.attempts.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.h2}>
                  {t("Your first win goes here.", "पहली जीत यहाँ दिखेगी।")}
                </Text>
                <Button
                  label={t("Play a puzzle", "Puzzle खेलें")}
                  onPress={() => select("play")}
                />
              </View>
            ) : (
              games.map((g) => {
                const records = state.attempts.filter(
                  (a) => a.game === g && !a.sessionId,
                );
                const best = new Map<string, Attempt>();
                records.forEach((a) => {
                  const key = `${a.profileId}-${a.level}-${a.assisted}`;
                  const prior = best.get(key);
                  if (!prior || compareAttempts(a, prior) < 0) best.set(key, a);
                });
                return (
                  <View key={g} style={styles.card}>
                    <Text style={[styles.h2, { color: accents[g] }]}>
                      {names[hi ? "hi" : "en"][g]}
                    </Text>
                    {[...best.values()]
                      .sort(
                        (a, b) => a.level - b.level || compareAttempts(a, b),
                      )
                      .slice(0, 10)
                      .map((a) => (
                        <View key={a.id} style={styles.between}>
                          <View>
                            <Txt>
                              {a.name} · L{a.level + 1}
                            </Txt>
                            <Txt muted>
                              {a.assisted
                                ? t("With hint", "Hint के साथ")
                                : t("Clean solve", "बिना hint")}
                            </Txt>
                          </View>
                          <Txt>{formatTime(a.elapsedMs)}</Txt>
                        </View>
                      ))}
                    {records.length === 0 && (
                      <Txt muted>
                        {t("No solo records yet.", "अभी solo record नहीं है।")}
                      </Txt>
                    )}
                  </View>
                );
              })
            )}
            {state.attempts.some((a) => a.sessionId) && (
              <View style={styles.card}>
                <Text style={styles.h2}>
                  {t("Recent family rounds", "पिछले family rounds")}
                </Text>
                {state.attempts
                  .filter((a) => a.sessionId)
                  .slice(0, 12)
                  .map((a) => (
                    <View style={styles.between} key={a.id}>
                      <Txt>
                        {a.name} · {names[hi ? "hi" : "en"][a.game]}
                        {a.assisted ? " ✦" : ""}
                      </Txt>
                      <Txt>{formatTime(a.elapsedMs)}</Txt>
                    </View>
                  ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {t("Make it yours.", "अपना अंदाज।")}
            </Text>
            <View style={styles.card}>
              <Text style={styles.h2}>
                {t("Local players", "इस फोन के खिलाड़ी")}
              </Text>
              {state.profiles.map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() =>
                    update({
                      ...state,
                      settings: { ...state.settings, activeProfileId: p.id },
                    })
                  }
                  style={[
                    styles.chip,
                    {
                      borderWidth: 1,
                      borderColor: current.id === p.id ? C.teal : C.line,
                    },
                  ]}
                >
                  <Txt>
                    {current.id === p.id ? "● " : "○ "}
                    {p.name}
                  </Txt>
                </Pressable>
              ))}
              <TextInput
                accessibilityLabel="New profile name"
                style={styles.input}
                placeholder={t("New player name", "नया नाम")}
                placeholderTextColor={C.muted}
                maxLength={24}
                value={profileName}
                onChangeText={setProfileName}
              />
              <Button
                label={t("Add profile", "Profile जोड़ें")}
                disabled={!profileName.trim()}
                onPress={() => {
                  if (
                    state.profiles.some(
                      (p) =>
                        p.name.toLowerCase() ===
                        profileName.trim().toLowerCase(),
                    )
                  ) {
                    setError(
                      t("That name already exists.", "यह नाम पहले से है।"),
                    );
                    return;
                  }
                  const p = {
                    id: uid(),
                    name: profileName.trim(),
                    avatar: state.profiles.length % 4,
                  };
                  update({
                    ...state,
                    profiles: [...state.profiles, p],
                    settings: { ...state.settings, activeProfileId: p.id },
                  });
                  setProfileName("");
                }}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.h2}>{t("Preferences", "सेटिंग्स")}</Text>
              <Button
                secondary
                label={
                  hi
                    ? "Language: हिन्दी → English"
                    : "Language: English → हिन्दी"
                }
                onPress={() =>
                  update({
                    ...state,
                    settings: { ...state.settings, language: hi ? "en" : "hi" },
                  })
                }
              />
              <Button
                secondary
                label={`${t("Haptics", "वाइब्रेशन")}: ${state.settings.haptics ? "ON" : "OFF"}`}
                onPress={() =>
                  update({
                    ...state,
                    settings: {
                      ...state.settings,
                      haptics: !state.settings.haptics,
                    },
                  })
                }
              />
              <Button
                secondary
                label={`${t("Reduced motion", "कम motion")}: ${state.settings.reducedMotion ? "ON" : "OFF"}`}
                onPress={() =>
                  update({
                    ...state,
                    settings: {
                      ...state.settings,
                      reducedMotion: !state.settings.reducedMotion,
                    },
                  })
                }
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.h2}>
                {t("Help shape the game", "अपनी राय दें")}
              </Text>
              <Txt muted>
                {t(
                  "Feedback stays on this device until you share it.",
                  "जब तक share न करें, राय इसी phone पर रहेगी।",
                )}
              </Txt>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${n} out of 5`}
                    onPress={() => setRating(n)}
                    style={styles.chip}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        color: n <= rating ? C.gold : C.muted,
                      }}
                    >
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                accessibilityLabel="Feedback"
                multiline
                value={feedback}
                onChangeText={(v) => {
                  setFeedback(v);
                  setSaved(false);
                }}
                placeholder={t(
                  "What felt fun? What was confusing?",
                  "क्या मजेदार था? कहाँ कठिनाई हुई?",
                )}
                placeholderTextColor={C.muted}
                style={[styles.input, { minHeight: 100 }]}
                maxLength={1000}
              />
              <Button
                label={
                  saved
                    ? t("Saved ✓", "Save हुआ ✓")
                    : t("Save feedback", "राय save करें")
                }
                disabled={!feedback.trim() || saved}
                onPress={() => {
                  update({
                    ...state,
                    feedback: [
                      ...state.feedback,
                      {
                        id: uid(),
                        rating,
                        text: feedback.trim(),
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  });
                  setSaved(true);
                }}
              />
              <Button
                secondary
                label={t(
                  "Export feedback & results",
                  "राय और results शेयर करें",
                )}
                onPress={() =>
                  share(
                    JSON.stringify(
                      {
                        app: "Dimag Ka Dangal",
                        version: "0.1.0",
                        feedback: state.feedback,
                        attempts: state.attempts,
                      },
                      null,
                      2,
                    ),
                  )
                }
              />
            </View>
            <Txt muted>
              {t(
                "Offline alpha · no ads · no account required. Removing the app may remove local records.",
                "Offline alpha · न ads · न account जरूरी। App हटाने पर local records हट सकते हैं।",
              )}
            </Txt>
          </>
        )}
      </ScrollView>
      {!round && !result && (
        <View style={styles.nav}>
          {(["play", "family", "scores", "profile"] as Tab[]).map((item, i) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityLabel={
                (hi
                  ? ["खेलें", "फैमिली", "स्कोर", "प्रोफाइल"]
                  : ["Play", "Family", "Scores", "You"])[i]
              }
              accessibilityState={{ selected: tab === item }}
              onPress={() => select(item)}
              style={{
                alignItems: "center",
                gap: 5,
                minWidth: 58,
                minHeight: 48,
              }}
            >
              <Text
                style={{ fontSize: 23, color: tab === item ? C.teal : C.muted }}
              >
                {["◈", "♧", "▥", "◎"][i]}
              </Text>
              <Text style={[styles.navText, tab === item && { color: C.teal }]}>
                {
                  (hi
                    ? ["खेलें", "फैमिली", "स्कोर", "प्रोफाइल"]
                    : ["Play", "Family", "Scores", "You"])[i]
                }
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
