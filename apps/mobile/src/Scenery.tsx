import React from "react";
import { View } from "react-native";
export function Tree({ small = false }: { small?: boolean }) {
  const size = small ? 24 : 36;
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size * 1.5, alignItems: "center" }}
    >
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: 3,
          height: size,
          backgroundColor: "#826D45",
        }}
      />
      <View
        style={{
          width: size,
          height: size * 1.15,
          borderRadius: size,
          backgroundColor: "#719A58",
          borderTopWidth: 3,
          borderLeftWidth: 3,
          borderColor: "#91B675",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size / 3,
          width: 2,
          height: size,
          backgroundColor: "#52733F",
        }}
      />
    </View>
  );
}
export function ParkEdge() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 22 }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: i * 147 + 30,
            left: i % 2 ? undefined : 12,
            right: i % 2 ? 12 : undefined,
            opacity: 0.75,
          }}
        >
          <Tree small={i % 3 === 0} />
        </View>
      ))}
    </View>
  );
}
export function House() {
  return (
    <View style={{ width: 26, height: 28, alignItems: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 14,
          borderRightWidth: 14,
          borderBottomWidth: 11,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#B85F40",
        }}
      />
      <View
        style={{
          width: 22,
          height: 16,
          backgroundColor: "#E3BE73",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <View style={{ width: 6, height: 10, backgroundColor: "#6B674B" }} />
      </View>
      <View
        style={{
          position: "absolute",
          top: 13,
          left: 5,
          width: 4,
          height: 4,
          backgroundColor: "#FDF4C8",
        }}
      />
    </View>
  );
}
export function Rider() {
  return (
    <View style={{ width: 28, height: 28 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 13,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#CB704B",
          borderTopWidth: 3,
          borderColor: "#AF493A",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 9,
          left: 10,
          width: 6,
          height: 10,
          borderRadius: 3,
          backgroundColor: "#4A91AC",
          transform: [{ rotate: "20deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 16,
          left: 17,
          width: 2,
          height: 8,
          backgroundColor: "#A66A48",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 22,
          left: 4,
          width: 19,
          height: 3,
          backgroundColor: "#B4613F",
        }}
      />
      {[3, 21].map((left) => (
        <View
          key={left}
          style={{
            position: "absolute",
            left,
            top: 23,
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: "#475549",
          }}
        />
      ))}
    </View>
  );
}
