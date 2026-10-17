import React, { useState } from "react";
import { View, Text, TextInput, Share } from "react-native";
import { useSocial, type Friend } from "./Social";
import { googleSignIn, authMessage } from "./auth";
import { Button, styles, C } from "../ui";
export function FriendsPanel({
  displayName,
  onShare,
  invitedHandle,
  game = "maze",
}: {
  game?: "maze" | "zip";
  displayName: string;
  onShare: () => void;
  invitedHandle?: string;
}) {
  const s = useSocial();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [handle, setHandle] = useState(""),
    [target, setTarget] = useState(invitedHandle || ""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [signup, setSignup] = useState(false);
  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await f();
    } catch (e) {
      setMessage(authMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const action = (name: string, args?: Record<string, unknown>) =>
    run(async () => {
      await s.rpc(name, args);
      await s.refresh();
    });
  const renderFriend = (f: Friend) => (
    <View
      key={f.peer_id}
      style={{
        backgroundColor: C.panel2,
        padding: 12,
        borderRadius: 16,
        gap: 8,
      }}
    >
      <View style={styles.between}>
        <View>
          <Text style={{ ...styles.text, fontWeight: "800" }}>
            {f.display_name}
          </Text>
          <Text style={styles.subtitle}>@{f.handle}</Text>
        </View>
        <Text style={{ fontSize: 11, color: f.online ? "#26794A" : C.muted }}>
          {f.online ? "● Online" : "○ Offline"}
        </Text>
      </View>
      {f.status === "accepted" ? (
        <View style={styles.row}>
          <Button
            label="Invite to play"
            disabled={busy || !f.online}
            onPress={() =>
              run(async () => {
                await s.queue(game, f.peer_id);
                setMessage("Invitation sent — open Online to wait.");
              })
            }
          />
          <Button
            label="Remove"
            secondary
            disabled={busy}
            onPress={() =>
              action("dangal_remove_friend", { p_peer: f.peer_id })
            }
          />
        </View>
      ) : (
        <View style={styles.row}>
          {f.incoming && (
            <Button
              label="Accept friend"
              disabled={busy}
              onPress={() =>
                action("dangal_accept_friend", { p_peer: f.peer_id })
              }
            />
          )}
          <Button
            label={f.incoming ? "Decline" : "Cancel request"}
            secondary
            disabled={busy}
            onPress={() =>
              action("dangal_remove_friend", { p_peer: f.peer_id })
            }
          />
        </View>
      )}
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      {s.loading ? (
        <Text style={styles.subtitle}>Connecting…</Text>
      ) : !s.cloud ? (
        <>
          <Text style={styles.subtitle}>
            {s.error || "Connection unavailable. Puzzles work offline."}
          </Text>
          <Button label="Share app" onPress={onShare} />
        </>
      ) : !s.session ? (
        <>
          <Text style={styles.h2}>
            {signup ? "Create your account" : "Welcome back"}
          </Text>
          <Button
            label="G · Continue with Google"
            disabled={busy}
            onPress={() => run(googleSignIn)}
          />
          <Text style={{ ...styles.subtitle, textAlign: "center" }}>
            or use email & password
          </Text>
          <TextInput
            accessibilityLabel="Email"
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Password"
            placeholder="Password · 8+ characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Button
            label={signup ? "Create account" : "Sign in"}
            disabled={busy || !email.trim() || !password}
            onPress={() =>
              run(async () => {
                if (signup && password.length < 8)
                  throw Error("Use at least 8 characters");
                const c = s.cloud!;
                const r = signup
                  ? await c.auth.signUp({ email: email.trim(), password })
                  : await c.auth.signInWithPassword({
                      email: email.trim(),
                      password,
                    });
                if (r.error) throw r.error;
                setPassword("");
                setMessage(
                  signup && !r.data.session
                    ? "Confirm your email, then sign in."
                    : "Signed in",
                );
                await s.refresh();
              })
            }
          />
          <Button
            label={
              signup
                ? "Already registered? Sign in"
                : "New here? Create account"
            }
            secondary
            disabled={busy}
            onPress={() => setSignup(!signup)}
          />
          <Text style={styles.subtitle}>
            Login is needed for friends, online matches and rankings. Solo and
            family play stay free without login.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {s.profile
              ? `${s.profile.display_name} · @${s.profile.handle}`
              : "Choose a handle so friends can find you"}
          </Text>
          {!s.profile && (
            <>
              <TextInput
                accessibilityLabel="Your handle"
                placeholder="your_handle"
                autoCapitalize="none"
                maxLength={24}
                value={handle}
                onChangeText={setHandle}
                style={styles.input}
              />
              <Button
                label="Save handle"
                disabled={busy || !handle.trim()}
                onPress={() =>
                  action("dangal_set_profile", {
                    p_handle: handle.toLowerCase().trim(),
                    p_name: displayName.trim() || "Player",
                  })
                }
              />
            </>
          )}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                accessibilityLabel="Friend handle"
                placeholder="Friend’s handle"
                maxLength={24}
                autoCapitalize="none"
                value={target}
                onChangeText={setTarget}
                style={styles.input}
              />
            </View>
            <Button
              label="Add"
              disabled={busy || !s.profile || !target.trim()}
              onPress={() =>
                run(async () => {
                  await s.rpc("dangal_request_friend", {
                    p_handle: target.toLowerCase().replace(/^@/, "").trim(),
                  });
                  setTarget("");
                  await s.refresh();
                  setMessage("Friend request sent");
                })
              }
            />
          </View>
          {(
            [
              [
                "Requests received",
                s.friends.filter((f) => f.status === "pending" && f.incoming),
              ],
              [
                "Requests sent",
                s.friends.filter((f) => f.status === "pending" && !f.incoming),
              ],
              ["My friends", s.friends.filter((f) => f.status === "accepted")],
            ] as [string, Friend[]][]
          ).map(([title, rows]) => (
            <View key={title} style={{ gap: 8 }}>
              <Text style={styles.h2}>
                {title} · {rows.length}
              </Text>
              {rows.length ? (
                rows.map(renderFriend)
              ) : (
                <Text style={styles.subtitle}>
                  {title === "My friends"
                    ? "No friends yet. Add a handle or invite someone."
                    : "No pending requests"}
                </Text>
              )}
            </View>
          ))}
          <Button
            label="Refresh friends"
            secondary
            disabled={busy}
            onPress={() => run(s.refresh)}
          />
          <Button
            label="Invite · Download app"
            disabled={!s.profile || busy}
            onPress={() =>
              run(async () => {
                await Share.share({
                  message: `Play Dimag Ka Dangal with me!\nDownload: https://github.com/sundaramseth/dimag-ka-dangal/releases/latest/download/Dimag-Ka-Dangal.apk\nMy handle: @${s.profile!.handle}\nInstalled? dangal://friend/${s.profile!.handle}`,
                });
              })
            }
          />
          <Button
            label="Sign out"
            secondary
            disabled={busy}
            onPress={() =>
              run(async () => {
                await s.rpc("dangal_heartbeat", { p_online: false });
                const r = await s.cloud!.auth.signOut();
                if (r.error) throw r.error;
              })
            }
          />
        </>
      )}
      {!!(message || s.error) && (
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
          {message || s.error}
        </Text>
      )}
    </View>
  );
}
