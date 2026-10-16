import React, { useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PUZZLES } from "./engine/journey";
import { chapterTheme, THEMES } from "./themes";
import { C } from "./ui";
import { Tree } from "./Scenery";
export function Mountain({ colour = "#889BA2" }: { colour?: string }) {
  return (
    <View style={{ width: 90, height: 85, alignItems: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 45,
          borderRightWidth: 45,
          borderBottomWidth: 85,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: colour,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          width: 0,
          height: 0,
          borderLeftWidth: 15,
          borderRightWidth: 15,
          borderBottomWidth: 28,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#EDF3ED",
        }}
      />
    </View>
  );
}
export function Waterfall() {
  return (
    <View
      style={{
        width: 60,
        height: 130,
        borderRadius: 28,
        backgroundColor: "#91C9CD",
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderColor: "#7F9F86",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * 10 + 3,
            top: 12,
            width: 3,
            height: 100,
            borderRadius: 4,
            backgroundColor: "#D6F0EB",
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          bottom: -8,
          width: 80,
          height: 24,
          borderRadius: 40,
          backgroundColor: "#72B9BF",
        }}
      />
    </View>
  );
}
export function JourneyMap({
  next,
  completed,
  onPlay,
}: {
  next: number;
  completed: Set<number>;
  onPlay: (i: number) => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const height = PUZZLES * 112 + 100;
  const go = () =>
    scroll.current?.scrollTo({
      y: Math.max(0, (PUZZLES - 1 - next) * 112 - 150),
      animated: false,
    });
  return (
    <ScrollView
      ref={scroll}
      bounces={false}
      overScrollMode="never"
      onContentSizeChange={go}
      contentContainerStyle={{ paddingBottom: 10 }}
    >
      <View
        style={{ height, width: "100%", maxWidth: 430, alignSelf: "center" }}
      >
        {Array.from({ length: 3 }, (_, chapter) => {
          const theme = THEMES[chapterTheme(chapter * 10)];
          return (
            <View
              key={chapter}
              pointerEvents="none"
              style={{
                position: "absolute",
                top: (2 - chapter) * 1120,
                width: "100%",
                height: 1120,
                backgroundColor: theme.ground,
                overflow: "hidden",
              }}
            >
              <Text
                style={{
                  position: "absolute",
                  top: 30,
                  alignSelf: "center",
                  color: theme.ink,
                  fontWeight: "900",
                  fontSize: 12,
                  letterSpacing: 1,
                }}
              >
                CHAPTER {chapter + 1} · {theme.name}
              </Text>
              {Array.from({ length: 6 }, (_, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    top: 150 + i * 155,
                    left: i % 2 ? undefined : 8,
                    right: i % 2 ? 8 : undefined,
                    opacity: 0.8,
                  }}
                >
                  {theme.scene === "forest" ? (
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <Tree />
                      <Tree small />
                    </View>
                  ) : theme.scene === "mountain" ? (
                    <Mountain />
                  ) : (
                    <Waterfall />
                  )}
                </View>
              ))}
            </View>
          );
        })}
        {Array.from({ length: PUZZLES }, (_, i) => {
          const x = [0, 60, 86, 45, -30, -75, -60][i % 7],
            px = [0, 60, 86, 45, -30, -75, -60][(i + 1) % 7],
            y = (PUZZLES - 1 - i) * 112 + 60,
            locked = i > next,
            solved = completed.has(i),
            theme = THEMES[chapterTheme(i)];
          return (
            <React.Fragment key={i}>
              {i < PUZZLES - 1 && (
                <View
                  style={{
                    position: "absolute",
                    top: y - 84,
                    left: "50%",
                    marginLeft: (x + px) / 2 - 5,
                    width: 10,
                    height: 112,
                    borderRadius: 6,
                    backgroundColor: solved ? "#C7AB78" : "#C6CEBE",
                    transform: [
                      {
                        rotate: `${(Math.atan2(px - x, 112) * 180) / Math.PI}deg`,
                      },
                    ],
                  }}
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Puzzle ${i + 1}${locked ? ", locked" : solved ? ", completed" : ", play"}`}
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => onPlay(i)}
                style={{
                  position: "absolute",
                  top: y,
                  left: "50%",
                  marginLeft: x - 31,
                  width: 62,
                  height: 62,
                  borderRadius: 24,
                  backgroundColor: locked
                    ? "#DAE0D0"
                    : solved
                      ? theme.wall
                      : theme.accent,
                  borderWidth: i === next ? 4 : 2,
                  borderColor:
                    i === next ? "#C99436" : locked ? "#C3CCB9" : "#E7EFD8",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 5px 0 #9DAE8C",
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "900",
                    color: locked ? "#9AA68F" : solved ? "#F6DC91" : theme.ink,
                  }}
                >
                  {locked ? "·" : solved ? "★" : i + 1}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
        <Text
          style={{
            position: "absolute",
            bottom: 4,
            alignSelf: "center",
            color: C.muted,
            fontSize: 11,
          }}
        >
          START ↑
        </Text>
      </View>
    </ScrollView>
  );
}
