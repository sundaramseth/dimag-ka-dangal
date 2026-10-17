import React, { useState } from "react";
import { Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSocial } from "./Social";
import { Button, C, styles } from "../ui";
import { Character } from "../Character";
export function InviteNotice() {
  const s = useSocial(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const m = s.inbox.find(
    (m) => m.state === "invited" && m.user_b === s.session?.user.id,
  );
  const act = async (accept: boolean) => {
    if (!m || busy) return;
    setBusy(true);
    setError("");
    try {
      if (accept) await s.accept(m.id);
      else {
        await s.rpc("dangal_leave_match", { p_id: m.id });
        await s.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      visible={!!m}
      transparent
      animationType="fade"
      onRequestClose={() => void act(false)}
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#142824BB",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View style={styles.card}>
          <Character game={m?.game} animate size={76} />
          <Text style={styles.title}>Let’s play!</Text>
          <Text accessibilityLiveRegion="assertive" style={styles.h2}>
            {m?.players.find((p) => p.id !== s.session?.user.id)?.name}{" "}
            challenges you
          </Text>
          <Text style={styles.text}>
            {m?.game === "maze" ? "Maze Runner" : "Number Trail"} · same puzzle
            · fastest solve wins
          </Text>
          <Button
            label="Accept & play"
            disabled={busy}
            onPress={() => void act(true)}
          />
          <Button
            label="Decline"
            secondary
            disabled={busy}
            onPress={() => void act(false)}
          />
          {!!error && <Text style={{ color: C.coral }}>{error}</Text>}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
