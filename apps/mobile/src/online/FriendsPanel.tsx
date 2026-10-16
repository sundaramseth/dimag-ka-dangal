import React, { useCallback, useEffect, useState } from "react";
import { Share, Text, TextInput, View } from "react-native";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { getCloud } from "./client";
import { Button, styles, C } from "../ui";
type FriendRow = {
  peer_id: string;
  handle: string;
  display_name: string;
  status: "pending" | "accepted";
  incoming: boolean;
};
export function FriendsPanel({
  displayName,
  onShare,
  invitedHandle,
}: {
  invitedHandle?: string;
  displayName: string;
  onShare: () => void;
}) {
  const [cloud, setCloud] = useState<SupabaseClient | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [session, setSession] = useState<Session | null>(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [handle, setHandle] = useState(""),
    [target, setTarget] = useState(invitedHandle || ""),
    [friends, setFriends] = useState<FriendRow[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [myHandle, setMyHandle] = useState("");
  const connect = () => {
    setConnecting(true);
    getCloud()
      .then(setCloud)
      .catch((e) => setMessage(e.message))
      .finally(() => setConnecting(false));
  };
  useEffect(() => {
    let alive = true;
    getCloud()
      .then((c) => {
        if (alive) setCloud(c);
      })
      .catch((e) => {
        if (alive) setMessage(e.message);
      })
      .finally(() => {
        if (alive) setConnecting(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    if (!cloud) return;
    const { data, error } = await cloud.rpc("dangal_friends");
    if (error) throw error;
    setFriends(data || []);
    const { data: profile } = await cloud
      .from("dangal_profiles")
      .select("handle")
      .maybeSingle();
    if (profile) setMyHandle(profile.handle);
  }, [cloud]);
  useEffect(() => {
    if (!cloud) return;
    let alive = true;
    cloud.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session);
    });
    const { data } = cloud.auth.onAuthStateChange((_, s) => {
      if (alive) setSession(s);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [cloud]);
  useEffect(() => {
    if (!session) return;
    const initial = setTimeout(
      () => refresh().catch((e) => setMessage(e.message)),
      0,
    );
    const timer = setInterval(() => refresh().catch(() => {}), 20000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [session, refresh]);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not connect. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!cloud)
    return (
      <View style={{ gap: 12 }}>
        <Text style={styles.subtitle}>
          {connecting
            ? "Connecting…"
            : message ||
              "Online setup is being connected. Your puzzles work offline."}
        </Text>
        <Button
          label="Retry connection"
          disabled={connecting}
          secondary
          onPress={connect}
        />
        <Button label="Share app for review" onPress={onShare} />
      </View>
    );
  return (
    <View style={{ gap: 12 }}>
      {!session ? (
        <>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Password"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Button
            label="Sign in"
            disabled={busy}
            onPress={() =>
              run(async () => {
                const r = await cloud.auth.signInWithPassword({
                  email: email.trim(),
                  password,
                });
                if (r.error) throw r.error;
                setPassword("");
              })
            }
          />
          <Button
            label="Create account"
            secondary
            disabled={busy}
            onPress={() =>
              run(async () => {
                if (password.length < 8)
                  throw Error("Use at least 8 characters.");
                const r = await cloud.auth.signUp({
                  email: email.trim(),
                  password,
                });
                if (r.error) throw r.error;
                setPassword("");
                setMessage(
                  r.data.session
                    ? "Signed in"
                    : "Check your email to confirm your account, then sign in.",
                );
              })
            }
          />
        </>
      ) : (
        <>
          <Text style={styles.text}>
            {myHandle ? `@${myHandle}` : "Choose your friend handle"}
          </Text>
          {!myHandle && (
            <>
              <TextInput
                autoCapitalize="none"
                accessibilityLabel="Your handle"
                placeholder="your_handle"
                value={handle}
                maxLength={24}
                onChangeText={setHandle}
                style={styles.input}
              />
              <Button
                label="Save handle"
                disabled={busy}
                onPress={() =>
                  run(async () => {
                    const r = await cloud.rpc("dangal_set_profile", {
                      p_handle: handle.toLowerCase().trim(),
                      p_name: displayName.trim() || "Player",
                    });
                    if (r.error) throw r.error;
                    await refresh();
                  })
                }
              />
            </>
          )}
          <TextInput
            autoCapitalize="none"
            accessibilityLabel="Friend handle"
            placeholder="Friend's handle"
            value={target}
            maxLength={24}
            onChangeText={setTarget}
            style={styles.input}
          />
          <Button
            label="Send request"
            disabled={busy || !myHandle}
            onPress={() =>
              run(async () => {
                const r = await cloud.rpc("dangal_request_friend", {
                  p_handle: target.toLowerCase().trim(),
                });
                if (r.error) throw r.error;
                setTarget("");
                await refresh();
              })
            }
          />
          {friends.map((f) => (
            <View
              key={f.peer_id}
              style={{
                padding: 12,
                borderRadius: 16,
                backgroundColor: C.panel2,
                gap: 8,
              }}
            >
              <Text style={styles.text}>
                {f.display_name} · @{f.handle}
              </Text>
              <Text style={styles.subtitle}>
                {f.status === "accepted"
                  ? "Friends"
                  : f.incoming
                    ? "Incoming request"
                    : "Request sent"}
              </Text>
              {f.status === "pending" && f.incoming && (
                <Button
                  label="Accept"
                  disabled={busy}
                  onPress={() =>
                    run(async () => {
                      const r = await cloud.rpc("dangal_accept_friend", {
                        p_peer: f.peer_id,
                      });
                      if (r.error) throw r.error;
                      await refresh();
                    })
                  }
                />
              )}
              <Button
                label={
                  f.status === "accepted"
                    ? "Remove"
                    : f.incoming
                      ? "Decline"
                      : "Cancel request"
                }
                secondary
                disabled={busy}
                onPress={() =>
                  run(async () => {
                    const r = await cloud.rpc("dangal_remove_friend", {
                      p_peer: f.peer_id,
                    });
                    if (r.error) throw r.error;
                    await refresh();
                  })
                }
              />
            </View>
          ))}
          <Button
            label="Refresh"
            secondary
            disabled={busy}
            onPress={() => run(refresh)}
          />
          <Button
            label="Invite · Download app"
            onPress={() =>
              run(async () => {
                await Share.share({
                  message: `Play Dimag Ka Dangal with me!\nDownload: https://github.com/sundaramseth/dimag-ka-dangal/releases/latest/download/Dimag-Ka-Dangal.apk\nMy handle: @${myHandle}\nAlready installed? dangal://friend/${myHandle}`,
                });
              })
            }
          />
          <Button
            label="Sign out"
            secondary
            onPress={() =>
              run(async () => {
                const r = await cloud.auth.signOut();
                if (r.error) throw r.error;
                setFriends([]);
                setMyHandle("");
              })
            }
          />
        </>
      )}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
          {message}
        </Text>
      )}
    </View>
  );
}
