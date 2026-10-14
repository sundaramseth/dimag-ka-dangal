import React, { useRef } from "react";
import {
  PanResponder,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ZipLevel, wallKey } from "./engine";
import { C, Txt } from "./ui";
export function ZipBoard({
  level,
  path,
  onCell,
  hi,
}: {
  level: ZipLevel;
  path: number[];
  onCell: (cell: number) => void;
  hi: boolean;
}) {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 68, 340),
    cellSize = boardWidth / level.size;
  const board = useRef<View>(null),
    callbacks = useRef({ onCell, cellSize, size: level.size });
  React.useEffect(() => {
    callbacks.current = { onCell, cellSize, size: level.size };
  }, [onCell, cellSize, level.size]);
  const geometry = useRef({ x: 0, y: 0 }),
    lastDrag = useRef(-1);
  const dragTo = (x: number, y: number) => {
    const { cellSize, size, onCell } = callbacks.current;
    const col = Math.floor((x - geometry.current.x) / cellSize),
      row = Math.floor((y - geometry.current.y) / cellSize);
    if (col < 0 || row < 0 || col >= size || row >= size) return;
    const cell = row * size + col;
    if (cell !== lastDrag.current) {
      lastDrag.current = cell;
      onCell(cell);
    }
  };
  // PanResponder stores event callbacks; refs below are read only when gestures fire.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = React.useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) + Math.abs(g.dy) > 4,
      onPanResponderGrant: (_, g) => {
        lastDrag.current = -1;
        board.current?.measureInWindow((x, y) => {
          geometry.current = { x, y };
          dragTo(g.x0, g.y0);
          dragTo(g.moveX, g.moveY);
        });
      },
      onPanResponderMove: (_, g) => dragTo(g.moveX, g.moveY),
      onPanResponderRelease: () => {
        lastDrag.current = -1;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  );
  const centre = (cell: number) => ({
    x: ((cell % level.size) + 0.5) * cellSize,
    y: (Math.floor(cell / level.size) + 0.5) * cellSize,
  });
  const walls = new Set(level.walls.map(([a, b]) => wallKey(a, b)));
  return (
    <View style={{ gap: 12, alignItems: "center" }}>
      <Txt muted>
        {hi
          ? `${path.length}/${level.size * level.size} खाने भरे`
          : `${path.length}/${level.size * level.size} cells filled`}
      </Txt>
      <View
        ref={board}
        {...responder.panHandlers}
        style={{
          width: boardWidth,
          height: boardWidth,
          backgroundColor: "#F1F5FF",
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#6A7B99",
        }}
      >
        {Array.from({ length: level.size * level.size }, (_, cell) => (
          <Pressable
            key={cell}
            accessibilityRole="button"
            accessibilityLabel={`Trail cell ${cell + 1}${level.checkpoints[cell] ? `, number ${level.checkpoints[cell]}` : ""}`}
            accessibilityState={{ selected: path.includes(cell) }}
            onPress={() => onCell(cell)}
            style={{
              position: "absolute",
              left: (cell % level.size) * cellSize,
              top: Math.floor(cell / level.size) * cellSize,
              width: cellSize,
              height: cellSize,
              borderWidth: 0.5,
              borderColor: "#A4AEC2",
              backgroundColor: path.includes(cell) ? "#BBEEDC" : "transparent",
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
                  backgroundColor: "#058A68",
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
                  backgroundColor: "#058A68",
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
                      backgroundColor: "#101728",
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
                  backgroundColor: path.at(-1) === cell ? "#058A68" : "#101728",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  zIndex: 4,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "white" }}
                >
                  {number}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <Text style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>
        {hi
          ? "1 से शुरू करें • सभी खाने भरें • आखिरी number पर खत्म करें"
          : "Start at 1 • Fill every cell • Finish at the last number"}
      </Text>
    </View>
  );
}
