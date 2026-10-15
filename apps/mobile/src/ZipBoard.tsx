import React, { useRef } from "react";
import {
  PanResponder,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { House, Rider } from "./Scenery";
import { ZipLevel, wallKey } from "./engine";

export function ZipBoard({
  level,
  path,
  onCell,
  maxWidth = 340,
  maze = false,
}: {
  level: Pick<ZipLevel, "size" | "checkpoints" | "walls">;
  path: number[];
  onCell: (cell: number) => void;
  hi: boolean;
  maxWidth?: number;
  maze?: boolean;
}) {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 48, maxWidth),
    cellSize = boardWidth / level.size;
  const callbacks = useRef({ onCell, cellSize, size: level.size });
  React.useLayoutEffect(() => {
    callbacks.current = { onCell, cellSize, size: level.size };
  }, [onCell, cellSize, level.size]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null),
    lastDrag = useRef(-1);
  const dragTo = (x: number, y: number) => {
    const { cellSize, size, onCell } = callbacks.current;
    const previous = lastPoint.current;
    const steps = previous
      ? Math.max(
          1,
          Math.ceil(
            Math.hypot(x - previous.x, y - previous.y) / (cellSize / 4),
          ),
        )
      : 1;
    for (let i = 1; i <= steps; i++) {
      const px = previous ? previous.x + ((x - previous.x) * i) / steps : x,
        py = previous ? previous.y + ((y - previous.y) * i) / steps : y;
      const col = Math.floor(px / cellSize),
        row = Math.floor(py / cellSize);
      if (col < 0 || row < 0 || col >= size || row >= size) continue;
      const cell = row * size + col;
      if (cell !== lastDrag.current) {
        lastDrag.current = cell;
        onCell(cell);
      }
    }
    lastPoint.current = { x, y };
  };
  // Event callbacks read refs only during a gesture.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = React.useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        lastDrag.current = -1;
        lastPoint.current = null;
        dragTo(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderMove: (e) =>
        dragTo(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderRelease: () => {
        lastDrag.current = -1;
        lastPoint.current = null;
      },
      onPanResponderTerminate: () => {
        lastDrag.current = -1;
        lastPoint.current = null;
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  );
  const centre = (cell: number) => ({
    x: ((cell % level.size) + 0.5) * cellSize,
    y: (Math.floor(cell / level.size) + 0.5) * cellSize,
  });
  const walls = new Set(level.walls.map(([a, b]) => wallKey(a, b)));
  return (
    <View style={{ gap: 12, alignItems: "center" }}>
      <View
        {...responder.panHandlers}
        style={{
          width: boardWidth,
          height: boardWidth,
          backgroundColor: maze ? "#EEF0CF" : "#FAF8EC",
          borderRadius: maze ? 4 : 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: maze ? "#427442" : "#AAB497",
        }}
      >
        {Array.from({ length: level.size * level.size }, (_, cell) => (
          <Pressable
            key={cell}
            accessibilityRole="button"
            accessibilityLabel={`Trail cell ${cell + 1}${level.checkpoints[cell] ? `, number ${level.checkpoints[cell]}` : ""}`}
            accessibilityState={{ selected: path.includes(cell) }}
            onPress={() => onCell(cell)}
            pointerEvents="none"
            onAccessibilityTap={() => onCell(cell)}
            accessibilityActions={[{ name: "activate" }]}
            onAccessibilityAction={() => onCell(cell)}
            style={{
              position: "absolute",
              left: (cell % level.size) * cellSize,
              top: Math.floor(cell / level.size) * cellSize,
              width: cellSize,
              height: cellSize,
              borderWidth: maze ? 0 : 0.5,
              borderColor: "#CFD5BE",
              backgroundColor: path.includes(cell) ? "#D1E3B5" : "transparent",
            }}
          />
        ))}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: boardWidth,
            height: boardWidth,
          }}
        >
          {path.slice(1).map((cell, i) => {
            const a = centre(path[i]),
              b = centre(cell);
            const horizontal = a.y === b.y;
            return (
              <View
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: Math.min(a.x, b.x) - (horizontal ? 0 : 5),
                  top: Math.min(a.y, b.y) - (horizontal ? 5 : 0),
                  width: horizontal ? Math.abs(b.x - a.x) : 10,
                  height: horizontal ? 10 : Math.abs(b.y - a.y),
                  backgroundColor: maze ? "#E2AC5A" : "#438B61",
                }}
              />
            );
          })}
          {path.map((cell) => {
            const p = centre(cell);
            return (
              <View
                key={`dot-${cell}`}
                style={{
                  position: "absolute",
                  left: p.x - 5,
                  top: p.y - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: maze ? "#E2AC5A" : "#438B61",
                }}
              />
            );
          })}
          {Array.from({ length: level.size * level.size }, (_, a) =>
            [a + 1, a + level.size]
              .filter((b) => walls.has(wallKey(a, b)))
              .map((b) => {
                const horizontal = b === a + 1;
                return (
                  <View
                    key={`wall-${a}-${b}`}
                    style={{
                      position: "absolute",
                      left: horizontal
                        ? ((a % level.size) + 1) * cellSize - 3
                        : (a % level.size) * cellSize,
                      top: horizontal
                        ? Math.floor(a / level.size) * cellSize
                        : (Math.floor(a / level.size) + 1) * cellSize - 3,
                      width: horizontal ? 6 : cellSize,
                      height: horizontal ? cellSize : 6,
                      backgroundColor: maze ? "#427442" : "#334734",
                      borderRadius: maze ? 3 : 0,
                      borderWidth: maze ? 1 : 0,
                      borderColor: "#78A35C",
                      zIndex: 3,
                    }}
                  />
                );
              }),
          )}
          {Object.entries(level.checkpoints).map(([key, number]) => {
            const cell = Number(key),
              p = centre(cell);
            return (
              <View
                key={key}
                style={{
                  position: "absolute",
                  left: p.x - 15,
                  top: p.y - 15,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: maze
                    ? "#F5EDCC"
                    : path.at(-1) === cell
                      ? "#438B61"
                      : "#263F32",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  zIndex: 4,
                  transform: [{ scale: Math.min(1, (cellSize - 6) / 30) }],
                }}
              >
                {maze ? (
                  number === 1 ? (
                    <Rider />
                  ) : (
                    <House />
                  )
                ) : (
                  <Text
                    style={{ fontSize: 16, fontWeight: "800", color: "white" }}
                  >
                    {number}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
