import React, { useEffect, useState } from "react";
import { Animated, View, Text } from "react-native";
export const STORIES = [
  {
    name: "Milo",
    title: "Whisper Woods",
    role: "Find Milo’s way home",
    colour: "#EBA250",
    ear: "#A25F34",
    scarf: "#2FAD99",
    ground: "#CDEED8",
    sky: "#84CEBE",
  },
  {
    name: "Piku",
    title: "Cloudpeak Quest",
    role: "Guide Piku across the peaks",
    colour: "#DCEBF4",
    ear: "#6387AD",
    scarf: "#E58464",
    ground: "#CFDFF3",
    sky: "#789CCC",
  },
  {
    name: "Nila",
    title: "Moonwater Falls",
    role: "Bring Nila to the hidden lagoon",
    colour: "#88CFD9",
    ear: "#3E8598",
    scarf: "#DDA74A",
    ground: "#D5D2F0",
    sky: "#9F91C8",
  },
];
export function Character({
  story = 0,
  game = "maze",
  size = 84,
  animate = false,
  reducedMotion = false,
}: {
  story?: number;
  game?: "maze" | "zip";
  size?: number;
  animate?: boolean;
  reducedMotion?: boolean;
}) {
  const [bob] = useState(() => new Animated.Value(0));
  const s = STORIES[Math.min(2, Math.floor(story))];
  useEffect(() => {
    if (!animate || reducedMotion) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -6,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [animate, reducedMotion, bob]);
  return (
    <View
      accessible
      accessibilityLabel={
        game === "zip"
          ? "Lumi the trail keeper"
          : `${s.name}, chapter companion`
      }
      style={{ width: size, height: size * 1.12 }}
    >
      <Animated.View
        style={{
          width: 100,
          height: 112,
          transform: [{ scale: size / 100 }, { translateY: bob }],
          transformOrigin: "top left",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 13,
            width: 74,
            height: 12,
            borderRadius: 50,
            backgroundColor: "#203C4822",
          }}
        />
        {game === "zip" ? (
          <>
            <View
              style={{
                position: "absolute",
                left: 7,
                top: 28,
                width: 34,
                height: 33,
                borderRadius: 30,
                backgroundColor: "#EAD5FF",
                transform: [{ rotate: "-25deg" }],
              }}
            />
            <View
              style={{
                position: "absolute",
                right: 7,
                top: 28,
                width: 34,
                height: 33,
                borderRadius: 30,
                backgroundColor: "#D4F3F9",
                transform: [{ rotate: "25deg" }],
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 23,
                top: 12,
                width: 54,
                height: 78,
                borderRadius: 29,
                backgroundColor: "#8B6AC6",
                borderWidth: 3,
                borderColor: "#BCA5EB",
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 31,
                top: 30,
                width: 38,
                height: 39,
                borderRadius: 22,
                backgroundColor: "#FFF2D3",
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 35,
                top: 72,
                width: 30,
                height: 18,
                borderRadius: 20,
                backgroundColor: "#F5D66F",
              }}
            />
          </>
        ) : (
          <>
            <View
              style={{
                position: "absolute",
                left: 18,
                top: 45,
                width: 64,
                height: 57,
                borderRadius: 28,
                backgroundColor: s.colour,
                borderBottomWidth: 6,
                borderColor: s.ear,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 8,
                top: 3,
                width: 28,
                height: 43,
                borderRadius: 10,
                backgroundColor: s.ear,
                transform: [{ rotate: "-20deg" }],
              }}
            />
            <View
              style={{
                position: "absolute",
                right: 8,
                top: 3,
                width: 28,
                height: 43,
                borderRadius: 10,
                backgroundColor: s.ear,
                transform: [{ rotate: "20deg" }],
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 11,
                top: 19,
                width: 78,
                height: 64,
                borderRadius: 34,
                backgroundColor: s.colour,
                borderTopWidth: 4,
                borderColor: "#FFFFFF66",
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 22,
                top: 39,
                width: 56,
                height: 36,
                borderRadius: 25,
                backgroundColor: "#FFF4DF",
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 18,
                top: 76,
                width: 65,
                height: 13,
                borderRadius: 5,
                backgroundColor: s.scarf,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 65,
                top: 82,
                width: 15,
                height: 20,
                borderRadius: 4,
                backgroundColor: s.scarf,
                transform: [{ rotate: "-15deg" }],
              }}
            />
          </>
        )}
        {[35, 59].map((left) => (
          <View
            key={left}
            style={{
              position: "absolute",
              left,
              top: game === "zip" ? 44 : 46,
              width: 7,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#293949",
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            left: 45,
            top: game === "zip" ? 57 : 59,
            width: 11,
            height: 7,
            borderRadius: 6,
            backgroundColor: "#563F4B",
          }}
        />
        {animate && (
          <Text
            style={{
              position: "absolute",
              right: -2,
              top: 0,
              fontSize: 20,
              color: "#F4C767",
            }}
          >
            ✦
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
