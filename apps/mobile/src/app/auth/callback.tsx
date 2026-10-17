import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { completeAuthCallback } from "../../online/auth";
import { Button, styles } from "../../ui";
export default function Callback() {
  const { code, error_description } = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();
  const [message, setMessage] = useState("Completing sign in…");
  useEffect(() => {
    if (error_description) return;
    if (code)
      completeAuthCallback(
        "dangal://auth/callback?code=" + encodeURIComponent(code),
      )
        .then(() => router.replace("/"))
        .catch((e) => setMessage(e.message));
  }, [code, error_description]);
  return (
    <View
      style={{ ...styles.root, justifyContent: "center", padding: 24, gap: 20 }}
    >
      <Text style={styles.text}>{error_description || message}</Text>
      <Button label="Return to game" onPress={() => router.replace("/")} />
    </View>
  );
}
