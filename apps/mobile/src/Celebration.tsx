import React, { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { Attempt } from "./engine";
import { secondsText } from "./engine/rewards";
import { C, styles } from "./ui";
export function Celebration({
  result,
  earned,
  bonus,
  reducedMotion,
  children,
}: {
  result: Attempt;
  earned: number;
  bonus: number;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false),
    [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? 0 : 1800,
      useNativeDriver: true,
    });
    animation.start();
    const id = setTimeout(() => setReady(true), reducedMotion ? 400 : 1900);
    return () => {
      animation.stop();
      clearTimeout(id);
    };
  }, [progress, reducedMotion]);
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: "center",
        gap: 16,
        overflow: "hidden",
      }}
    >
      {!reducedMotion &&
        Array.from({ length: 20 }, (_, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 10,
              left: `${(i * 17) % 100}%`,
              width: 8,
              height: i % 2 ? 8 : 14,
              borderRadius: i % 3 ? 2 : 5,
              backgroundColor: [C.gold, C.teal, "#CE83AE", "#70A6C2"][i % 4],
              opacity: progress.interpolate({
                inputRange: [0, 0.1, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 480 + (i % 5) * 40],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", `${i % 2 ? 400 : -300}deg`],
                  }),
                },
              ],
            }}
          />
        ))}
      <Animated.View
        style={[
          styles.card,
          {
            alignItems: "center",
            gap: 16,
            transform: [
              {
                scale: reducedMotion
                  ? 1
                  : progress.interpolate({
                      inputRange: [0, 0.3, 0.55, 1],
                      outputRange: [0.75, 1.06, 1, 1],
                    }),
              },
            ],
          },
        ]}
      >
        <Text style={{ color: C.gold, fontSize: 42 }}>
          ★ {result.assisted ? "☆" : "★"} ★
        </Text>
        <Text style={styles.title}>Puzzle cleared!</Text>
        <Text style={{ fontSize: 44, fontWeight: "900", color: C.ink }}>
          {secondsText(result.elapsedMs)}
        </Text>
        <Text style={{ fontSize: 25, color: "#7962A5", fontWeight: "900" }}>
          ◆ +{earned}
        </Text>
        <Text style={styles.subtitle}>
          {bonus
            ? "Chapter complete · +40 bonus"
            : earned
              ? "Gems collected"
              : result.sessionId
                ? "Battle round complete"
                : "Already collected · Practice solve"}
        </Text>
      </Animated.View>
      {ready ? (
        children
      ) : (
        <View
          style={{ height: 64, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={styles.subtitle}>Collecting rewards…</Text>
        </View>
      )}
    </View>
  );
}
