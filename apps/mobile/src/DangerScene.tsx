import React, { useEffect, useState } from "react";
import { Animated, View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Doodle } from "./Doodle";
export function DangerScene({
  dragon = false,
  reducedMotion = false,
}: {
  dragon?: boolean;
  reducedMotion?: boolean;
}) {
  const [wing] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reducedMotion) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(wing, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(wing, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [wing, reducedMotion]);
  return (
    <View
      pointerEvents="none"
      style={{
        height: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "#51426422",
        borderRadius: 12,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            transform: [
              {
                translateY: wing.interpolate({
                  inputRange: [0, 1],
                  outputRange: [i % 2 ? -3 : 3, i % 2 ? 3 : -3],
                }),
              },
              {
                scaleX: wing.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                }),
              },
            ],
          }}
        >
          <Svg width={33} height={23} viewBox="0 0 40 25">
            <Path
              d="M20 10L4 2 1 17l8-3 4 7 7-7 7 7 4-7 8 3-3-15-16 8M17 9l1-6 3 6 3-6 1 9"
              fill="#4E3C65"
            />
            <Path d="M18 11h1m4 0h1" stroke="#F5D27A" strokeWidth={2} />
          </Svg>
        </Animated.View>
      ))}
      {dragon && <Doodle name="dragon" size={30} color="#8E4A43" />}
      <Text style={{ fontSize: 10, fontWeight: "900", color: "#654163" }}>
        {dragon ? "DRAGON GATE" : "DANGER PASS"}
      </Text>
    </View>
  );
}
