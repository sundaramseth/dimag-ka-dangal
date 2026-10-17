import React from "react";
import { emitSound } from "./sound";
import { Pressable, StyleSheet, Text, View } from "react-native";
export const C = {
  bg: "#E8EEDB",
  panel: "#F7F6EB",
  panel2: "#DCE5CF",
  ink: "#243A2B",
  muted: "#657558",
  teal: "#83B96B",
  coral: "#AD583D",
  gold: "#CA8D32",
  line: "#CBD7B9",
};
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: {
    padding: 22,
    paddingBottom: 110,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 18,
  },
  title: {
    fontFamily: "DangalTitle",
    fontSize: 26,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: "DangalTitle",
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
  },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: C.teal },
  card: {
    padding: 20,
    backgroundColor: C.panel,
    borderRadius: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h2: {
    fontFamily: "DangalGame",
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
  },
  text: {
    fontFamily: "DangalGame",
    fontSize: 13,
    color: C.ink,
    lineHeight: 19,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    padding: 14,
    backgroundColor: C.panel2,
    color: C.ink,
    borderColor: C.line,
    borderWidth: 1,
    fontSize: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.panel2,
    borderRadius: 12,
  },
  board: { alignSelf: "center", width: "100%", maxWidth: 340, gap: 8 },
  cell: {
    height: 68,
    flex: 1,
    backgroundColor: C.panel2,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  cellText: { fontSize: 25, fontWeight: "800", color: C.ink },
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.panel,
    borderTopWidth: 1,
    borderColor: C.line,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  navText: { fontSize: 12, fontWeight: "700", color: C.muted },
  stat: {
    flex: 1,
    padding: 14,
    backgroundColor: C.panel,
    borderRadius: 18,
    gap: 4,
  },
  statValue: { fontSize: 25, fontWeight: "800", color: C.ink },
});
export function Txt({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? styles.subtitle : styles.text}>{children}</Text>;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        emitSound("tap");
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 50,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: secondary ? C.panel2 : C.teal,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text
        style={{
          fontFamily: "DangalGame",
          fontSize: 13,
          fontWeight: "800",
          color: C.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Pill({
  text,
  colour = C.teal,
}: {
  text: string;
  colour?: string;
}) {
  return (
    <View style={styles.chip}>
      <Text style={{ color: colour, fontSize: 11, fontWeight: "800" }}>
        {text}
      </Text>
    </View>
  );
}
