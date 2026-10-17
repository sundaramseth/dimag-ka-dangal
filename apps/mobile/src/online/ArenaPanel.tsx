import React, { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useSocial, type OnlineMatch, type Ranking } from "./Social";
import { MatchOutcome } from "./MatchOutcome";
import { authMessage } from "./auth";
import { Button, styles, C } from "../ui";
export function ArenaPanel({
  game,
  onLogin,
  onGame,
  reducedMotion = false,
}: {
  game: "zip" | "maze";
  onGame?: (g: "zip" | "maze") => void;
  reducedMotion?: boolean;
  onLogin: () => void;
}) {
  const s = useSocial();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      setError("");
      await f();
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (!s.session || !s.profile)
    return (
      <View style={{ gap: 12 }}>
        <Text style={styles.subtitle}>
          Sign in once. Then tap Find opponent to play the same puzzle against
          someone online.
        </Text>
        <Button label="Continue with Google / Email" onPress={onLogin} />
      </View>
    );
  const incoming = s.inbox.filter(
    (m) => m.state === "invited" && m.user_b === s.session!.user.id,
  );
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        {(["zip", "maze"] as const).map((g) => (
          <View key={g} style={{ flex: 1 }}>
            <Button
              label={g === "zip" ? "Number Trail" : "Maze Runner"}
              secondary={game !== g}
              disabled={
                !!s.match &&
                ["active", "waiting", "invited"].includes(s.match.state)
              }
              onPress={() => onGame?.(g)}
            />
          </View>
        ))}
      </View>
      <Text style={styles.subtitle}>
        Same puzzle. Server-timed results. No hints.
      </Text>
      {s.match && ["waiting", "invited", "active"].includes(s.match.state) ? (
        <View style={styles.card}>
          <Text style={styles.h2}>
            {s.match.state === "waiting"
              ? "Finding a real player…"
              : s.match.state === "invited"
                ? "Waiting for your friend…"
                : "Match found · starting…"}
          </Text>
          <Text style={styles.subtitle}>
            {s.match.players.map((p) => p.name).join(" vs ")}
            {s.match.state === "waiting"
              ? "Your search ends after 90 seconds."
              : ""}
          </Text>
          <Button
            label="Cancel / leave"
            secondary
            disabled={busy}
            onPress={() => run(s.leave)}
          />
        </View>
      ) : (
        <Button
          label="Play online · Find opponent"
          disabled={busy}
          onPress={() => run(() => s.queue(game))}
        />
      )}
      {incoming.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.text}>
            {m.players.find((p) => p.id !== s.session!.user.id)?.name} invited
            you · {m.game === "zip" ? "Number Trail" : "Maze Runner"}
          </Text>
          <View style={styles.row}>
            <Button
              label="Accept game"
              disabled={busy}
              onPress={() => run(() => s.accept(m.id))}
            />
            <Button
              label="Decline game"
              secondary
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await s.rpc("dangal_leave_match", { p_id: m.id });
                  await s.refresh();
                })
              }
            />
          </View>
        </View>
      ))}
      {s.match?.state === "finished" && (
        <MatchSummary matchId={s.match.id} reducedMotion={reducedMotion} />
      )}
      <Text style={styles.h2}>Invite a friend</Text>
      {s.friends
        .filter((f) => f.status === "accepted")
        .map((f) => (
          <View key={f.peer_id} style={styles.between}>
            <View>
              <Text style={styles.text}>{f.display_name}</Text>
              <Text style={styles.subtitle}>
                {f.online ? "● Online" : "○ Offline"}
              </Text>
            </View>
            <Button
              label="Invite"
              disabled={busy || !f.online}
              onPress={() => run(() => s.queue(game, f.peer_id))}
            />
          </View>
        ))}
      {!s.friends.some((f) => f.status === "accepted") && (
        <Text style={styles.subtitle}>
          Add friends from the Friends screen. Local family play works without
          login.
        </Text>
      )}
      {!!(error || s.error) && (
        <Text style={styles.subtitle}>{error || s.error}</Text>
      )}
    </View>
  );
}
export function RankingsPanel({ onLogin }: { onLogin: () => void }) {
  const s = useSocial();
  const { rpc, session } = s;
  const [friends, setFriends] = useState(false),
    [rows, setRows] = useState<Ranking[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [version, setVersion] = useState(0);
  useEffect(() => {
    if (!session) return;
    let alive = true;
    const task = async () => {
      setLoading(true);
      setError("");
      try {
        let all: Ranking[] = [],
          offset = 0;
        for (;;) {
          const page = await rpc<Ranking[]>("dangal_rankings", {
            p_friends: friends,
            p_offset: offset,
          });
          if (!alive) return;
          all = all.concat(page || []);
          if (!friends || page.length < 200) break;
          offset += 200;
        }
        if (alive) setRows(all);
      } catch (e) {
        if (alive) setError(authMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    };
    void task();
    return () => {
      alive = false;
    };
  }, [session, rpc, friends, version]);
  if (!session || !s.profile)
    return (
      <View style={{ gap: 12 }}>
        <Text style={styles.subtitle}>
          Sign in to see your global and friends position.
        </Text>
        <Button label="Sign in" onPress={onLogin} />
      </View>
    );
  const row = (r: Ranking) => (
    <View
      key={r.id}
      accessibilityLabel={`Rank ${r.position}, ${r.name}${r.is_self ? ", you" : ""}, ${r.wins} wins`}
      style={{
        ...styles.between,
        padding: 12,
        borderRadius: 14,
        backgroundColor: r.is_self ? "#D9EBC2" : C.panel2,
        borderWidth: r.is_self ? 2 : 0,
        borderColor: C.gold,
      }}
    >
      <Text style={{ ...styles.text, fontWeight: "900", width: 38 }}>
        #{r.position}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...styles.text, fontWeight: "800" }}>
          {r.is_self ? s.profile?.display_name || r.name : r.name}
          {r.is_self ? " · YOU" : ""}
        </Text>
        <Text style={{ fontSize: 10, color: C.muted }}>@{r.is_self ? s.profile?.handle || r.handle : r.handle}</Text>
      </View>
      <Text style={styles.text}>{r.wins} wins</Text>
    </View>
  );
  const own = rows.find((r) => r.is_self && r.position > 50);
  return (
    <View style={{ gap: 9 }}>
      <View style={styles.row}>
        <Button
          label="Public · Top 50"
          secondary={friends}
          onPress={() => setFriends(false)}
        />
        <Button
          label="Friends · All"
          secondary={!friends}
          onPress={() => setFriends(true)}
        />
      </View>
      <Text style={styles.subtitle}>
        Verified online match wins · all-time. Only real registered players.
      </Text>
      {loading ? (
        <Text style={styles.subtitle}>Loading rankings…</Text>
      ) : (
        <>
          {rows.filter((r) => friends || r.position <= 50).map(row)}
          {!friends && own && (
            <>
              <Text style={styles.label}>YOUR POSITION</Text>
              {row(own)}
            </>
          )}
          {!rows.length && (
            <Text style={styles.subtitle}>
              No ranked players yet. Complete an online battle.
            </Text>
          )}
        </>
      )}
      <Button
        label="Refresh rankings"
        secondary
        disabled={loading}
        onPress={() => setVersion((v) => v + 1)}
      />
      {!!error && <Text style={styles.subtitle}>{error}</Text>}
    </View>
  );
}
type Message = {
  id: number;
  sender: string;
  name: string;
  body: string;
  sent_at: string;
};
export function MatchSummary({
  matchId,
  reducedMotion = false,
}: {
  matchId: string;
  reducedMotion?: boolean;
}) {
  const s = useSocial();
  const { rpc } = s;
  const [m, setM] = useState<OnlineMatch | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true,
      inflight = false;
    const poll = async () => {
      if (inflight) return;
      inflight = true;
      try {
        const [match, chat] = await Promise.all([
          rpc<OnlineMatch>("dangal_match_state", { p_id: matchId }),
          rpc<Message[]>("dangal_chat", { p_id: matchId }),
        ]);
        if (alive) {
          setM(match);
          setMessages(chat || []);
        }
      } catch (e) {
        if (alive) setError(authMessage(e));
      } finally {
        inflight = false;
      }
    };
    void poll();
    const t = setInterval(poll, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [matchId, rpc]);
  const peer = m?.players.find((p) => p.id !== s.session?.user.id);
  return (
    <View style={{ gap: 9 }}>
      {m ? (
        <MatchOutcome match={m} reducedMotion={reducedMotion} />
      ) : (
        <Text style={styles.h2}>Checking results…</Text>
      )}
      {m?.players.map((p) => (
        <View style={styles.between} key={p.id}>
          <Text style={styles.text}>
            {p.name}
            {p.id === s.session?.user.id ? " · You" : ""}
          </Text>
          <Text style={styles.text}>
            {p.elapsed_ms === null
              ? "Playing…"
              : `${Math.floor(p.elapsed_ms / 1000)}s · verified`}
          </Text>
        </View>
      ))}
      {peer && !s.friends.some((f) => f.peer_id === peer.id) && (
        <Button
          label={`Add ${peer.name} as friend`}
          secondary
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await rpc("dangal_request_friend", { p_handle: peer.handle });
              await s.refresh();
              setError("Friend request sent");
            } catch (e) {
              setError(authMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      <Text style={styles.label}>MATCH CHAT</Text>
      <View style={{ maxHeight: 160, gap: 5 }}>
        {messages.slice(-8).map((x) => (
          <Text
            key={x.id}
            style={{
              ...styles.text,
              color: x.sender === s.session?.user.id ? C.ink : C.muted,
            }}
          >
            <Text style={{ fontWeight: "900" }}>{x.name}: </Text>
            {x.body}
          </Text>
        ))}
        {!messages.length && (
          <Text style={styles.subtitle}>Say good game 👋</Text>
        )}
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextInput
            accessibilityLabel="Match message"
            placeholder="Good game!"
            maxLength={160}
            value={text}
            onChangeText={setText}
            style={{ ...styles.input, minHeight: 42, fontSize: 13 }}
          />
        </View>
        <Button
          label="Send"
          disabled={busy || !text.trim()}
          onPress={async () => {
            setBusy(true);
            try {
              setMessages(
                await rpc<Message[]>("dangal_chat", {
                  p_id: matchId,
                  p_text: text,
                }),
              );
              setText("");
              setError("");
            } catch (e) {
              setError(authMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
      {!!error && <Text style={styles.subtitle}>{error}</Text>}
    </View>
  );
}
