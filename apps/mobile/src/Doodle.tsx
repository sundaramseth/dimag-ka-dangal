import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { C } from "./ui";
const ink = {
  back: "M25 8L10 17l15 9M10 17h23",
  close: "M9 8l21 22M30 8L9 30",
  friends:
    "M10 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M25 18a5 5 0 1 0 0-10 5 5 0 0 0 0 10M2 31c0-13 17-13 17 0M21 23c8-3 14 1 14 8",
  trophy:
    "M10 5h18v10c0 13-18 13-18 0zM10 8H4c-1 9 4 13 10 12M28 8h6c1 8-3 12-10 12M19 24v9M11 33h16",
  swords:
    "M5 5l5 1 21 22-4 4L6 10zM31 5l-5 1-9 10M10 25l-5 5M4 22l10 10M22 26l10-5",
  home: "M3 17L18 4l16 13M8 15v19h22V15M15 33V22h8v11",
  gems: "M4 12l7-8h15l8 8-15 23zM4 12h30M11 4l8 31 7-31",
  profile: "M18 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16M4 34c0-17 29-17 29 0",
  settings:
    "M18 11a7 7 0 1 0 0 14 7 7 0 0 0 0-14M15 4h7l1 5 5 2 5-1 3 6-4 4-1 5 2 4-6 4-4-3h-6l-4 3-5-4 2-5-1-5-4-3 3-6 5 1 4-3z",
  dragon: "M4 29l6-15 8 5 6-15 8 10-8 8 4 10-10-5-7 7M9 14L3 5l15 8M25 12h1",
  danger: "M18 3L2 33h32zM18 12v10M18 28h.1",
  gate: "M4 34V8l6-5 6 5v26M23 34V8l6-5 6 5v26M15 13h9M15 22h9",
  boat: "M3 25h32l-7 9H10zM18 3v21M18 4l12 15H18M4 36l6-2 6 2 6-2 7 2",
} as const;
export type IconName = keyof typeof ink;
export function Doodle({
  name,
  size = 26,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      accessibilityElementsHidden
    >
      <Path
        d={ink[name]}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={ink[name]}
        transform="translate(.6 -.4)"
        opacity={0.2}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
      />
    </Svg>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Doodle name={name} />
    </Pressable>
  );
}
export function GameNav({
  onFriends,
  onOnline,
  onFamily,
  onRanks,
  onSettings,
}: {
  onFriends: () => void;
  onOnline: () => void;
  onFamily: () => void;
  onRanks: () => void;
  onSettings: () => void;
}) {
  const items: [IconName, string, () => void][] = [
    ["settings", "Settings", onSettings],
    ["friends", "Friends", onFriends],
    ["home", "Family", onFamily],
    ["trophy", "Ranks", onRanks],
    ["swords", "Battle", onOnline],
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F8E9C9",
        borderTopWidth: 2,
        borderColor: "#BFA978",
        paddingVertical: 6,
      }}
    >
      {items.map(([name, label, onPress]) => (
        <Pressable
          key={name}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={{
            flex: 1,
            minHeight: 54,
            gap: 3,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Doodle name={name} />
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.ink }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
