import React, { useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PUZZLES } from "./engine/journey";
import { chapterTheme, THEMES } from "./themes";
import { C } from "./ui";
import { Character, STORIES } from "./Character";
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
  game = "maze",
  reducedMotion = false,
}: {
  next: number;
  completed: Set<number>;
  onPlay: (i: number) => void;
  game?: "zip" | "maze";
  reducedMotion?: boolean;
}) {
  const scroll = useRef<ScrollView>(null);
  const step = 88,
    height = PUZZLES * step + 130;
  const x = (i: number) => [0, 65, 96, 60, -12, -77, -94, -48, 25, 79][i % 10];
  const y = (i: number) => (PUZZLES - 1 - i) * step + 100;
  const go = () =>
    scroll.current?.scrollTo({
      y: Math.max(0, y(next) - 180),
      animated: false,
    });
  return (
    <ScrollView
      ref={scroll}
      bounces={false}
      overScrollMode="never"
      onContentSizeChange={go}
      contentContainerStyle={{ paddingBottom: 8 }}
    >
      <View
        style={{
          height,
          width: "100%",
          maxWidth: 430,
          alignSelf: "center",
          backgroundColor: game === "maze" ? "#D1EACB" : "#E4D5EE",
        }}
      >
        {Array.from({ length: 3 }, (_, ch) => {
          const story = STORIES[ch];
          const theme = THEMES[chapterTheme(ch * 10)];
          return (
            <View
              key={ch}
              pointerEvents="none"
              style={{
                position: "absolute",
                top: (2 - ch) * step * 10,
                width: "100%",
                height: step * 10 + 100,
                backgroundColor:
                  game === "maze"
                    ? story.ground
                    : ["#EDDDF5", "#DCE5F5", "#CEE9E7"][ch],
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 32,
                  alignSelf: "center",
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: "#FFFFFF99",
                  borderBottomWidth: 3,
                  borderColor: "#FFFFFF",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1,
                    color: theme.ink,
                  }}
                >
                  CHAPTER {ch + 1} ·{" "}
                  {game === "maze"
                    ? story.title
                    : ["Lumi Gardens", "Starlight Steps", "Aurora Isles"][ch]}
                </Text>
              </View>
              {Array.from({ length: 5 }, (_, j) => (
                <View
                  key={j}
                  style={{
                    position: "absolute",
                    top: 120 + j * 156,
                    left: j % 2 ? undefined : -18,
                    right: j % 2 ? -18 : undefined,
                    width: 133,
                    height: 100,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      width: 133,
                      height: 42,
                      borderRadius: 80,
                      backgroundColor: game === "maze" ? "#93B58C" : "#B8A4CB",
                      borderTopWidth: 13,
                      borderColor: game === "maze" ? "#BED19A" : "#D8C6E7",
                      transform: [{ rotate: j % 2 ? "8deg" : "-8deg" }],
                    }}
                  />
                  <View style={{ alignItems: "center", marginTop: -15 }}>
                    {ch === 0 ? (
                      <View style={{ flexDirection: "row", gap: 7 }}>
                        <Tree />
                        <Tree small />
                      </View>
                    ) : ch === 1 ? (
                      <Mountain
                        colour={game === "maze" ? "#7994AA" : "#ACA0C2"}
                      />
                    ) : (
                      <View
                        style={{ transform: [{ scale: 0.62 }], marginTop: -35 }}
                      >
                        <Waterfall />
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      position: "absolute",
                      bottom: 17,
                      left: 18,
                      color: "#FFF0B6",
                      fontSize: 22,
                    }}
                  >
                    ✦
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
        {Array.from({ length: PUZZLES - 1 }, (_, i) =>
          Array.from({ length: 12 }, (_, j) => {
            const t = j / 12,
              u = (j + 1) / 12;
            const point = (v: number) => ({
              x: x(i) + (x(i + 1) - x(i)) * (v * v * (3 - 2 * v)),
              y: y(i) + 26 - step * v,
            });
            const a = point(t),
              b = point(u),
              length = Math.hypot(b.x - a.x, b.y - a.y) + 3;
            return (
              <View
                key={`${i}-${j}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: "50%",
                  marginLeft: (a.x + b.x) / 2 - 7,
                  top: (a.y + b.y) / 2 - length / 2,
                  width: 14,
                  height: length,
                  borderRadius: 8,
                  backgroundColor: completed.has(i) ? "#E9B764" : "#FFFFFFBC",
                  borderLeftWidth: 3,
                  borderRightWidth: 3,
                  borderColor: completed.has(i) ? "#F9DEA1" : "#D8C5DD",
                  transform: [
                    {
                      rotate: `${(-Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI}deg`,
                    },
                  ],
                }}
              />
            );
          }),
        )}
        {Array.from({ length: PUZZLES }, (_, i) => {
          const locked = i > next,
            solved = completed.has(i);
          return (
            <React.Fragment key={i}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Puzzle ${i + 1}${locked ? ", locked" : solved ? ", completed" : ", play"}`}
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => onPlay(i)}
                style={{
                  position: "absolute",
                  top: y(i),
                  left: "50%",
                  marginLeft: x(i) - 31,
                  width: 62,
                  height: 54,
                  borderRadius: 28,
                  backgroundColor: locked
                    ? "#C4BED1"
                    : solved
                      ? "#E7AD4F"
                      : game === "maze"
                        ? "#5DAF85"
                        : "#A47CCA",
                  borderWidth: 3,
                  borderBottomWidth: 7,
                  borderColor: locked
                    ? "#ACA5BC"
                    : solved
                      ? "#B67B36"
                      : game === "maze"
                        ? "#3A7C61"
                        : "#795695",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 3px 0 #FFFFFF99",
                }}
              >
                <Text
                  style={{
                    fontSize: locked ? 17 : 21,
                    fontWeight: "900",
                    color: locked ? "#ECE8F2" : "#FFF9E9",
                  }}
                >
                  {locked ? "⌁" : i + 1}
                </Text>
                {solved && (
                  <Text
                    style={{
                      position: "absolute",
                      bottom: -22,
                      color: "#CA8D32",
                      fontSize: 19,
                    }}
                  >
                    ★
                  </Text>
                )}
              </Pressable>
              {i === next && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: y(i) - 30,
                    left: "50%",
                    marginLeft: x(i) + (x(i) > 0 ? -88 : 43),
                  }}
                >
                  <Character
                    game={game}
                    story={Math.floor(i / 10)}
                    size={54}
                    animate
                    reducedMotion={reducedMotion}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
        <Text
          style={{
            position: "absolute",
            bottom: 8,
            alignSelf: "center",
            fontSize: 11,
            fontWeight: "800",
            color: C.muted,
          }}
        >
          START ↑
        </Text>
      </View>
    </ScrollView>
  );
}
