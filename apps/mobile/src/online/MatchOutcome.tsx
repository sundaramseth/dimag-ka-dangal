import React, { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSocial, type OnlineMatch } from "./Social";
import { Character } from "../Character";
import { emitSound } from "../sound";
import { styles, C } from "../ui";
export function MatchOutcome({
  match: m,
  reducedMotion = false,
}: {
  match: OnlineMatch;
  reducedMotion?: boolean;
}) {
  const s = useSocial(),
    won = m.winner === s.session?.user.id,
    finished = m.state === "finished";
  const [burst] = useState(() => new Animated.Value(0));
  const winner = m.players.find((p) => p.id === m.winner);
  useEffect(() => {
    if (!finished) return;
    emitSound(won ? "win" : "level");
    if (reducedMotion) return;
    const a = Animated.timing(burst, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [finished, won, burst, reducedMotion]);
  return (
    <View
      style={{
        alignItems: "center",
        gap: 8,
        padding: 18,
        backgroundColor: won ? "#F5E5B3" : "#E0E6F0",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {finished &&
        won &&
        !reducedMotion &&
        Array.from({ length: 18 }, (_, i) => (
          <Animated.View
            pointerEvents="none"
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: 70,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: [C.gold, "#A16ECA", C.teal][i % 3],
              opacity: burst.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(i * 2.4) * 150],
                  }),
                },
                {
                  translateY: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(i * 2.4) * 140],
                  }),
                },
              ],
            }}
          />
        ))}
      <Character
        story={s.profile?.avatar === -1 ? 0 : s.profile?.avatar || 0}
        game={m.game}
        size={72}
        animate={!reducedMotion}
        reducedMotion={reducedMotion}
        mood={
          finished ? (won ? "victory" : m.winner ? "sad" : "happy") : "idle"
        }
      />
      <Text accessibilityLiveRegion="assertive" style={styles.h2}>
        {finished
          ? winner
            ? `${winner.name} won the match!`
            : "It’s a draw!"
          : m.state === "cancelled"
            ? "Match ended"
            : "Submitted · waiting for opponent"}
      </Text>
      <Text style={styles.text}>
        {finished
          ? won
            ? "Hurray! You won — great solve!"
            : winner
              ? `Congratulations, ${winner.name}! Ready for a rematch?`
              : "Both players finished together."
          : "The final result appears here for both players."}
      </Text>
    </View>
  );
}
