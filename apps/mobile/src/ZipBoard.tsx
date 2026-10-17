import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { House } from "./Scenery";
import { Character } from "./Character";
import { ZipLevel, wallKey } from "./engine";
import { Theme, THEMES } from "./themes";
type BoardLevel = Pick<ZipLevel, "size" | "walls" | "checkpoints"> & {
  relics?: number[];
};
const StaticLayer = memo(function StaticLayer({
  level,
  cellSize,
  theme,
  maze,
  onCell,
}: {
  level: BoardLevel;
  cellSize: number;
  theme: Theme;
  maze: boolean;
  onCell: (c: number) => void;
}) {
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: level.size ** 2 }, (_, cell) => (
        <Pressable
          key={cell}
          pointerEvents="none"
          accessibilityRole="button"
          accessibilityLabel={`Trail cell ${cell + 1}${level.checkpoints[cell] ? `, number ${level.checkpoints[cell]}` : ""}`}
          onAccessibilityTap={() => onCell(cell)}
          onAccessibilityAction={() => onCell(cell)}
          accessibilityActions={[{ name: "activate" }]}
          onPress={() => onCell(cell)}
          style={{
            position: "absolute",
            left: (cell % level.size) * cellSize,
            top: Math.floor(cell / level.size) * cellSize,
            width: cellSize,
            height: cellSize,
            borderWidth: maze ? 0 : 0.5,
            borderColor: "#BBC7AD",
            backgroundColor: maze && cell % 4 === 0 ? theme.tile : undefined,
          }}
        />
      ))}
      {level.walls.map(([a, b]) => {
        const vertical = b === a + 1;
        return (
          <View
            pointerEvents="none"
            key={wallKey(a, b)}
            style={{
              position: "absolute",
              left: vertical
                ? ((a % level.size) + 1) * cellSize - (maze ? 4 : 2.5)
                : (a % level.size) * cellSize,
              top: vertical
                ? Math.floor(a / level.size) * cellSize
                : (Math.floor(a / level.size) + 1) * cellSize -
                  (maze ? 4 : 2.5),
              width: vertical ? (maze ? 8 : 5) : cellSize + 2,
              height: vertical ? cellSize + 2 : maze ? 8 : 5,
              backgroundColor: theme.wall,
              borderRadius: 3,
              borderTopWidth: maze ? 2 : 1,
              borderLeftWidth: maze ? 1 : 0,
              borderColor: theme.accent,
            }}
          />
        );
      })}
    </View>
  );
});
export const ZipBoard = memo(function ZipBoard({
  level,
  path,
  onCell,
  onCells,
  maxWidth = 340,
  maze = false,
  theme = THEMES.forest,
  story = 0,
}: {
  level: BoardLevel;
  path: number[];
  onCell: (cell: number) => void;
  onCells?: (cells: number[]) => void;
  hi: boolean;
  maxWidth?: number;
  maze?: boolean;
  theme?: Theme;
  story?: number;
}) {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 48, maxWidth),
    cellSize = boardWidth / level.size;
  const callbacks = useRef({ onCell, onCells, cellSize, size: level.size });
  useLayoutEffect(() => {
    callbacks.current = { onCell, onCells, cellSize, size: level.size };
  }, [onCell, onCells, cellSize, level.size]);
  const geometry = useRef({ x: 0, y: 0 }),
    lastPoint = useRef<{ x: number; y: number } | null>(null),
    lastCell = useRef(-1),
    pending = useRef<number[]>([]),
    frame = useRef<number | null>(null);
  const flush = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const cells = pending.current;
    pending.current = [];
    const cb = callbacks.current;
    if (cb.onCells) cb.onCells(cells);
    else cells.forEach(cb.onCell);
  };
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  const sample = (x: number, y: number) => {
    const { cellSize, size } = callbacks.current;
    const old = lastPoint.current;
    const steps = old
      ? Math.max(
          1,
          Math.ceil(Math.hypot(x - old.x, y - old.y) / (cellSize / 3)),
        )
      : 1;
    for (let i = 1; i <= steps; i++) {
      const px = old ? old.x + ((x - old.x) * i) / steps : x,
        py = old ? old.y + ((y - old.y) * i) / steps : y;
      const col = Math.floor(px / cellSize),
        row = Math.floor(py / cellSize);
      if (col < 0 || row < 0 || col >= size || row >= size) continue;
      // Require a small step inside a new cell, preventing edge jitter from undoing a move.
      const margin = cellSize * 0.1;
      if (
        lastCell.current >= 0 &&
        (px - col * cellSize < margin ||
          px - col * cellSize > cellSize - margin ||
          py - row * cellSize < margin ||
          py - row * cellSize > cellSize - margin)
      )
        continue;
      const cell = row * size + col;
      if (cell !== lastCell.current) {
        lastCell.current = cell;
        pending.current.push(cell);
      }
    }
    lastPoint.current = { x, y };
    if (frame.current === null) frame.current = requestAnimationFrame(flush);
  };
  // Refs are read only by gesture callbacks, not during render.
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        lastCell.current = -1;
        lastPoint.current = null;
        geometry.current = {
          x: e.nativeEvent.pageX - e.nativeEvent.locationX,
          y: e.nativeEvent.pageY - e.nativeEvent.locationY,
        };
        sample(e.nativeEvent.locationX, e.nativeEvent.locationY);
        flush();
      },
      onPanResponderMove: (e) =>
        sample(
          e.nativeEvent.pageX - geometry.current.x,
          e.nativeEvent.pageY - geometry.current.y,
        ),
      onPanResponderRelease: flush,
      onPanResponderTerminate: () => {
        pending.current = [];
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
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
  const stableTap = React.useCallback(
    (cell: number) => callbacks.current.onCell(cell),
    [],
  );
  return (
    <View
      {...responder.panHandlers}
      style={{
        width: boardWidth,
        height: boardWidth,
        backgroundColor: theme.field,
        borderRadius: maze ? 8 : 16,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: theme.wall,
      }}
    >
      <StaticLayer
        level={level}
        cellSize={cellSize}
        theme={theme}
        maze={maze}
        onCell={stableTap}
      />
      <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
        {path.map((cell, i) => {
          const a = centre(cell),
            b = i ? centre(path[i - 1]) : a,
            horizontal = a.y === b.y;
          return (
            <View
              key={cell}
              style={{
                position: "absolute",
                left: Math.min(a.x, b.x) - 4,
                top: Math.min(a.y, b.y) - 4,
                width: horizontal ? Math.abs(a.x - b.x) + 8 : 8,
                height: horizontal ? 8 : Math.abs(a.y - b.y) + 8,
                borderRadius: 5,
                backgroundColor: theme.path,
              }}
            />
          );
        })}
        {Object.entries(level.checkpoints).map(([key, n]) => {
          const cell = +key;
          if (maze && n === 1 && path.length) return null;
          const p = centre(cell);
          return (
            <View
              key={key}
              style={{
                position: "absolute",
                left: p.x - 14,
                top: p.y - 14,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: maze ? theme.tile : theme.ink,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: Math.min(1, (cellSize - 4) / 28) }],
              }}
            >
              {maze ? (
                n === 1 ? (
                  <Character story={story} size={26} />
                ) : (
                  <House />
                )
              ) : (
                <Text
                  style={{ color: "#FFF", fontWeight: "900", fontSize: 15 }}
                >
                  {n}
                </Text>
              )}
            </View>
          );
        })}
        {maze && path.length > 0 && (
          <View
            style={{
              position: "absolute",
              left: centre(path.at(-1)!).x - 14,
              top: centre(path.at(-1)!).y - 14,
              transform: [{ scale: Math.min(1, (cellSize - 3) / 28) }],
            }}
          >
            <Character story={story} size={26} />
          </View>
        )}
      </View>
    </View>
  );
});
