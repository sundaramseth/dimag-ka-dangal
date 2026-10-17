import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Attempt, compareAttempts } from "./engine";
import { PUZZLES, streak, unlocked, stars } from "./engine/journey";
import { LocalState } from "./storage/types";
import { loadState, saveState } from "./storage";
import { JourneyMap } from "./JourneyMap";
import { ChapterCrossing } from "./ChapterCrossing";
import { Celebration } from "./Celebration";
import { ThemeShop } from "./ThemeShop";
import { Music } from "./Music";
import { award, freshWallet, secondsText, spendHint } from "./engine/rewards";
import { gameTheme } from "./themes";
import { FriendsPanel } from "./online/FriendsPanel";
import { LandingScreen } from "./LandingScreen";
import { emitSound } from "./sound";
import { useSocial } from "./online/Social";
import { ArenaPanel, RankingsPanel, MatchSummary } from "./online/ArenaPanel";
import { ActiveGame, GameScreen, FinishStats } from "./GameScreen";
import { ProfileScreen } from "./ProfileScreen";
import { InviteNotice } from "./online/InviteNotice";
import { IconButton, GameNav } from "./Doodle";
import { Button, C, styles } from "./ui";
type Panel =
  | "profile"
  | "settings"
  | "battle"
  | "themes"
  | "friends"
  | "online"
  | "rankings"
  | null;
type Round = {
  game: ActiveGame;
  index: number;
  variant: number;
  name: string;
  profileId: string;
  sessionId?: string;
  matchId?: string;
};
type Battle = {
  id: string;
  seed: number;
  players: string[];
  turn: number;
  results: Attempt[];
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const names = { zip: "Number Trail", maze: "Maze Runner" };
export default function DangalApp() {
  const social = useSocial();
  const [home, setHome] = useState(true),
    [crossing, setCrossing] = useState<number | null>(null),
    [onlineResult, setOnlineResult] = useState<string | null>(null),
    [pendingSubmit, setPendingSubmit] = useState<{
      id: string;
      path: number[];
    } | null>(null),
    [submitError, setSubmitError] = useState("");
  const latestState = useRef<LocalState | null>(null),
    playedMatch = useRef(""),
    shownOutcome = useRef("");
  const router = useRouter();
  const { friend, screen } = useLocalSearchParams<{
    friend?: string;
    screen?: string;
  }>();
  const panel: Panel = [
    "profile",
    "settings",
    "battle",
    "themes",
    "friends",
    "online",
    "rankings",
  ].includes(screen || "")
    ? (screen as Panel)
    : null;
  const setPanel = useCallback(
    (value: Panel) => router.setParams({ screen: value || "" }),
    [router],
  );
  const [state, setState] = useState<LocalState | null>(null),
    [game, setGame] = useState<ActiveGame>("zip"),
    [round, setRound] = useState<Round | null>(null),
    [result, setResult] = useState<Attempt | null>(null),
    [battle, setBattle] = useState<Battle | null>(null),
    [players, setPlayers] = useState(["Player 1", "Player 2"]),
    [error, setError] = useState(""),
    [reward, setReward] = useState({ earned: 0, bonus: 0 });
  useEffect(() => {
    if (friend) {
      const id = setTimeout(() => setPanel("friends"), 0);
      return () => clearTimeout(id);
    }
  }, [friend, setPanel]);
  useEffect(() => {
    const m = social.match;
    if (!state || !m || m.state !== "active" || playedMatch.current === m.id)
      return;
    const timer = setTimeout(
      () => {
        playedMatch.current = m.id;
        setPanel(null);
        setHome(false);
        setResult(null);
        setBattle(null);
        setOnlineResult(null);
        const p =
          state.profiles.find((p) => p.id === state.settings.activeProfileId) ||
          state.profiles[0];
        setRound({
          game: m.game,
          index: m.puzzle,
          variant: m.seed,
          name: social.profile?.display_name || p.name,
          profileId: p.id,
          sessionId: `online:${m.id}`,
          matchId: m.id,
        });
        emitSound("level");
      },
      Math.max(0, Date.parse(m.starts_at!) - Date.parse(m.server_now)),
    );
    return () => clearTimeout(timer);
  }, [social.match, social.profile, state, setPanel]);
  useEffect(() => {
    if (
      !round?.matchId ||
      social.match?.id !== round.matchId ||
      !["finished", "cancelled"].includes(social.match.state)
    )
      return;
    const t = setTimeout(() => {
      setRound(null);
      setResult(null);
      setOnlineResult(social.match!.id);
      setPanel("online");
    }, 0);
    return () => clearTimeout(t);
  }, [round, social.match, setPanel]);
  useEffect(() => {
    const m = social.match;
    if (!m || m.state !== "finished" || shownOutcome.current === m.id) return;
    const timer = setTimeout(() => {
      shownOutcome.current = m.id;
      setRound(null);
      setResult(null);
      setOnlineResult(m.id);
      setPanel("online");
    }, 0);
    return () => clearTimeout(timer);
  }, [social.match, setPanel]);
  const writing = useRef(Promise.resolve());
  useEffect(() => {
    loadState()
      .then((v) => {
        latestState.current = v;
        setState(v);
      })
      .catch(() => setError("Storage unavailable. Restart the app."));
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (crossing !== null) {
        setCrossing(null);
        return true;
      }
      if (panel) {
        setPanel(null);
        return true;
      }
      if (round || result) {
        if (round?.matchId) void social.leave().catch(() => {});
        setRound(null);
        setResult(null);
        setBattle(null);
        return true;
      }
      if (!home) {
        setHome(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [panel, round, result, home, social, setPanel, crossing]);
  const update = (next: LocalState) => {
    latestState.current = next;
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
  const starMap = new Map<number, number>();
  for (const a of activeAttempts) starMap.set(a.level, Math.max(starMap.get(a.level) || 0, stars(a)));
  const completed = new Set(activeAttempts.map((a) => a.level));
  const wallet = state.wallets[current.id] || freshWallet();
  const activeTheme = gameTheme(
    wallet,
    round?.index ?? next,
    round?.game || game,
  );
  const tap = () => {
    if (state.settings.haptics && Platform.OS !== "web")
      Haptics.selectionAsync().catch(() => {});
  };
  const start = (index: number, crossed = false) => {
    if (
      !crossed &&
      index > 0 &&
      index % 10 === 0 &&
      result?.level === index - 1 &&
      !completed.has(index)
    ) {
      setCrossing(index);
      return;
    }
    tap();
    emitSound("level");
    setOnlineResult(null);
    setPendingSubmit(null);
    setSubmitError("");
    setBattle(null);
    setResult(null);
    setRound({
      game,
      index,
      variant: 0,
      name: social.profile?.display_name || current.name,
      profileId: current.id,
    });
  };
  const share = async () => {
    try {
      await Share.share({
        message: `Dimag Ka Dangal — ${names[game]}${result ? ` · Puzzle ${result.level + 1} · ${secondsText(result.elapsedMs)}` : ""}\nTry the Android test app and send your review.\nhttps://github.com/sundaramseth/dimag-ka-dangal/releases/latest/download/Dimag-Ka-Dangal.apk`,
      });
    } catch {
      setError(t("Share unavailable.", "शेयर नहीं हुआ।"));
    }
  };
  const submitOnline = async (id: string, path: number[]) => {
    setSubmitError("");
    try {
      await social.submit(id, path);
      setPendingSubmit(null);
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : "Result not sent. Retry while match is active.",
      );
    }
  };
  const finish = (stats: FinishStats) => {
    if (!round) return;
    const { path, ...summary } = stats;
    const a: Attempt = {
      ...summary,
      id: uid(),
      profileId: round.profileId,
      name: round.name,
      game: round.game,
      level: round.index,
      variant: round.variant,
      sessionId: round.sessionId,
      createdAt: new Date().toISOString(),
    };
    const latest = latestState.current || state;
    const granted = award(latest.wallets[current.id] || freshWallet(), a);
    setReward({ earned: granted.earned, bonus: granted.bonus });
    update({
      ...latest,
      attempts: [a, ...latest.attempts],
      wallets: { ...latest.wallets, [current.id]: granted.wallet },
    });
    if (battle) setBattle({ ...battle, results: [...battle.results, a] });
    setOnlineResult(round.matchId || null);
    if (round.matchId) {
      setPendingSubmit({ id: round.matchId, path });
      void submitOnline(round.matchId, path);
    }
    setRound(null);
    setResult(a);
    tap();
  };
  const payHint = () => {
    if (round?.matchId) return false;
    const latest = latestState.current || state;
    const paid = spendHint(latest.wallets[current.id] || freshWallet());
    if (!paid) return false;
    update({ ...latest, wallets: { ...latest.wallets, [current.id]: paid } });
    return true;
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
    emitSound("level");
    setOnlineResult(null);
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
      <Music
        enabled={state.settings.music}
        sound={state.settings.sound}
        celebration={result?.id ?? null}
      />
      {crossing !== null ? (
        <ChapterCrossing
          chapter={Math.floor(crossing / 10)}
          reducedMotion={settings.reducedMotion}
          onEnter={() => {
            const i = crossing;
            setCrossing(null);
            start(i, true);
          }}
        />
      ) : round ? (
        <GameScreen
          key={`${round.game}-${round.index}-${round.profileId}`}
          theme={activeTheme}
          gems={wallet.gems}
          playerName={round.sessionId && !round.matchId ? round.name : social.profile?.display_name || round.name}
          haptics={settings.haptics}
          reducedMotion={settings.reducedMotion}
          avatar={social.profile?.avatar ?? current.avatar}
          photo={social.profile?.avatar_url}
          onProfile={() => setPanel("profile")}
          onGems={() => setPanel("themes")}
          onHint={payHint}
          online={!!round.matchId}
          game={round.game}
          index={round.index}
          variant={round.variant}
          hi={hi}
          onFinish={finish}
          onExit={() => {
            if (round.matchId) void social.leave().catch(() => {});
            setRound(null);
            setBattle(null);
          }}
        />
      ) : result ? (
        <Celebration
          key={result.id}
          result={result}
          earned={reward.earned}
          bonus={reward.bonus}
          reducedMotion={state.settings.reducedMotion}
        >
          {onlineResult && (
            <>
              <MatchSummary
                matchId={onlineResult}
                reducedMotion={settings.reducedMotion}
              />
              {!!submitError && (
                <Text style={styles.subtitle}>{submitError}</Text>
              )}
              {pendingSubmit && (
                <Button
                  label="Retry result submission"
                  onPress={() =>
                    void submitOnline(pendingSubmit.id, pendingSubmit.path)
                  }
                />
              )}
            </>
          )}
          {battle && (
            <View style={styles.card}>
              {[...battle.results].sort(compareAttempts).map((a, i) => (
                <View key={a.id} style={styles.between}>
                  <Text style={styles.text}>
                    {i === 0 ? "♛" : i + 1} {a.name}
                  </Text>
                  <Text style={styles.text}>
                    {secondsText(a.elapsedMs)}
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
          ) : !battle && !onlineResult && result.level + 1 < PUZZLES ? (
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
              setOnlineResult(null);
              social.select(null);
              setBattle(null);
            }}
          />
        </Celebration>
      ) : home ? (
        <LandingScreen
          photo={social.profile?.avatar_url}
          avatar={social.profile?.avatar ?? current.avatar}
          onProfile={() => setPanel("profile")}
          onGems={() => setPanel("themes")}
          name={social.profile?.display_name || current.name}
          gems={wallet.gems}
          game={game}
          next={next}
          reducedMotion={settings.reducedMotion}
          onGame={setGame}
          onJourney={() => {
            emitSound("level");
            setHome(false);
          }}
          onFriends={() => setPanel("friends")}
          onOnline={() => setPanel("online")}
          onFamily={() => setPanel("battle")}
          onRanks={() => setPanel("rankings")}
          onSettings={() => setPanel("settings")}
        />
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Home"
                  onPress={() => setHome(true)}
                >
                  <Text style={styles.label}>
                    ‹ HOME · {social.profile?.display_name || current.name}
                  </Text>
                </Pressable>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Themes"
                onPress={() => setPanel("themes")}
              >
                <Text
                  accessibilityLabel={`${wallet.gems} gems`}
                  style={styles.text}
                >
                  💎 {wallet.gems}
                </Text>
              </Pressable>
              <Text style={styles.text}>
                ♨ {streak(state.attempts, current.id)}
              </Text>
              <Text style={styles.subtitle}>
                {completed.size}/{PUZZLES} ✓
              </Text>
            </View>
          </View>
          <JourneyMap
            key={game}
            game={game}
            reducedMotion={settings.reducedMotion}
            next={next}
            completed={completed}
            stars={starMap}
            onPlay={start}
          />
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
            <GameNav
              onFriends={() => setPanel("friends")}
              onOnline={() => setPanel("online")}
              onFamily={() => setPanel("battle")}
              onRanks={() => setPanel("rankings")}
              onSettings={() => setPanel("settings")}
            />
          </View>
        </>
      )}
      <Modal
        visible={panel !== null}
        presentationStyle="fullScreen"
        animationType={settings.reducedMotion ? "none" : "fade"}
        onRequestClose={() => setPanel(null)}
      >
        {panel !== null && (
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: C.bg,
              padding: 16,
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
            >
              <View style={{ flex: 1, gap: 18 }}>
                <View style={styles.between}>
                  <Text style={styles.h2}>
                    {panel === "profile"
                      ? "Your profile"
                      : panel === "settings"
                        ? t("Settings", "सेटिंग्स")
                        : panel === "themes"
                          ? "Themes"
                          : panel === "friends"
                            ? "Friends"
                            : panel === "online"
                              ? "Online arena"
                              : panel === "rankings"
                                ? "Rankings"
                                : t("Local battle", "लोकल बैटल")}
                  </Text>
                  <IconButton
                    name="back"
                    label="Back"
                    onPress={() => setPanel(null)}
                  />
                </View>
                {panel === "profile" ? (
                  <ProfileScreen
                    key={social.profile?.id || current.id}
                    name={current.name}
                    onLogin={() => setPanel("friends")}
                    onLocal={(name, avatar) => {
                      const latest = latestState.current || state;
                      update({
                        ...latest,
                        profiles: latest.profiles.map((p) =>
                          p.id === current.id ? { ...p, name, avatar } : p,
                        ),
                      });
                    }}
                  />
                ) : panel === "online" ? (
                  <ArenaPanel
                    reducedMotion={settings.reducedMotion}
                    game={game}
                    onGame={setGame}
                    onLogin={() => setPanel("friends")}
                  />
                ) : panel === "rankings" ? (
                  <RankingsPanel onLogin={() => setPanel("friends")} />
                ) : panel === "friends" ? (
                  <FriendsPanel
                    key={friend || "manual"}
                    game={game}
                    displayName={current.name}
                    onShare={share}
                    invitedHandle={friend}
                  />
                ) : panel === "themes" ? (
                  <ThemeShop
                    wallet={wallet}
                    onChange={(w) =>
                      update({
                        ...state,
                        wallets: { ...state.wallets, [current.id]: w },
                      })
                    }
                  />
                ) : panel === "settings" ? (
                  <>
                    {[
                      ["Haptics", "haptics"],
                      ["Music", "music"],
                      ["Sound effects", "sound"],
                      ["Reduce motion", "reducedMotion"],
                    ].map(([label, key]) => (
                      <View key={key} style={styles.between}>
                        <Text style={styles.text}>{label}</Text>
                        <Switch
                          accessibilityLabel={label}
                          value={
                            settings[
                              key as
                                | "haptics"
                                | "reducedMotion"
                                | "music"
                                | "sound"
                            ]
                          }
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
                    <Text style={styles.text}>
                      💎 {wallet.gems} gems · Hints cost 5
                    </Text>
                    <Button
                      label="Test sound ♪"
                      secondary
                      onPress={() => {
                        if (settings.sound) emitSound("win");
                        else setError("Enable Sound effects first");
                      }}
                    />
                    <Button
                      label="Themes · ◆"
                      secondary
                      onPress={() => setPanel("themes")}
                    />
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
                      v0.6.0 ·{" "}
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
                          setPlayers([
                            ...players,
                            `Player ${players.length + 1}`,
                          ])
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
                        "For online battles, open Play online.",
                        "ऑनलाइन बैटल के लिए Play online खोलें।",
                      )}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
      <InviteNotice />
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
