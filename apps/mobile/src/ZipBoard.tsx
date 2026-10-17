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
import Svg, { Path as SvgPath, Circle } from "react-native-svg";
import { House } from "./Scenery";
import { Character } from "./Character";
import { ZipLevel, wallKey } from "./engine";
import { Theme, THEMES } from "./themes";
type BoardLevel = Pick<ZipLevel, "size" | "walls" | "checkpoints"> & {
  relics?: number[];
  shape?: string;
  cells?: number[];
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
      {(
        level.cells ||
        Array.from({ length: level.size ** 2 }, (_, cell) => cell)
      ).map((cell) => (
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
            backgroundColor: maze
              ? (Math.floor(cell / level.size) + (cell % level.size)) %
                  (theme.scene === "forest" ? 3 : 2) ===
                0
                ? theme.tile
                : theme.field
              : (cell + Math.floor(cell / level.size)) % 2
                ? theme.field
                : theme.tile,
            borderRadius: !maze && theme.scene === "mountain" ? 5 : 0,
          }}
        />
      ))}
      {level.cells &&
        level.cells.length < level.size ** 2 &&
        level.cells.flatMap((a) =>
          [0, 1, 2, 3].map((d) => {
            const row = Math.floor(a / level.size),
              col = a % level.size;
            const b = [a - level.size, a + 1, a + level.size, a - 1][d];
            if (
              level.cells!.includes(b) &&
              !(d === 1 && col === level.size - 1) &&
              !(d === 3 && col === 0)
            )
              return null;
            return (
              <View
                pointerEvents="none"
                key={`edge:${a}:${d}`}
                style={{
                  position: "absolute",
                  left: col * cellSize + (d === 1 ? cellSize - 2 : 0),
                  top: row * cellSize + (d === 2 ? cellSize - 2 : 0),
                  width: d % 2 ? 4 : cellSize + 2,
                  height: d % 2 ? cellSize + 2 : 4,
                  backgroundColor: theme.wall,
                }}
              />
            );
          }),
        )}
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
  const boardWidth = Math.min(width - 32, maxWidth),
    cellSize = boardWidth / level.size;
  const callbacks = useRef({
    onCell,
    onCells,
    cellSize,
    size: level.size,
    rings: level.shape === "rings",
  });
  useLayoutEffect(() => {
    callbacks.current = {
      onCell,
      onCells,
      cellSize,
      size: level.size,
      rings: level.shape === "rings",
    };
  }, [onCell, onCells, cellSize, level.size, level.shape]);
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
    const { cellSize, size, rings } = callbacks.current;
    const old = lastPoint.current;
    const steps = old
      ? Math.max(
          1,
          Math.min(
            size * 6,
            Math.ceil(Math.hypot(x - old.x, y - old.y) / (cellSize / 3)),
          ),
        )
      : 1;
    for (let i = 1; i <= steps; i++) {
      const px = old ? old.x + ((x - old.x) * i) / steps : x,
        py = old ? old.y + ((y - old.y) * i) / steps : y;
      const radius = (size * cellSize) / 2,
        dx = px - radius,
        dy = py - radius;
      const polarRow = Math.floor(
        (Math.hypot(dx, dy) - radius * 0.12) / ((radius * 0.88) / size),
      );
      const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      const col = rings
          ? Math.floor((angle / (2 * Math.PI)) * size)
          : Math.floor(px / cellSize),
        row = rings ? polarRow : Math.floor(py / cellSize);
      if (col < 0 || row < 0 || col >= size || row >= size) continue;
      // Require a small step inside a new cell, preventing edge jitter from undoing a move.
      const margin = cellSize * 0.04;
      const previousCol = lastCell.current % size;
      const previousRow = Math.floor(lastCell.current / size);
      if (
        !rings &&
        lastCell.current >= 0 &&
        ((col !== previousCol &&
          (px - col * cellSize < margin ||
            px - col * cellSize > cellSize - margin)) ||
          (row !== previousRow &&
            (py - row * cellSize < margin ||
              py - row * cellSize > cellSize - margin)))
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
  // Handlers read refs only on native gesture events; the lazy initializer never invokes them.
  // eslint-disable-next-line react-hooks/refs
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
      onPanResponderRelease: (e) => {
        sample(
          e.nativeEvent.pageX - geometry.current.x,
          e.nativeEvent.pageY - geometry.current.y,
        );
        flush();
        lastPoint.current = null;
      },
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
  const centre = (cell: number) =>
    level.shape === "rings"
      ? (() => {
          const radius = boardWidth / 2,
            r =
              radius * 0.12 +
              ((Math.floor(cell / level.size) + 0.5) * radius * 0.88) /
                level.size,
            a = (((cell % level.size) + 0.5) * 2 * Math.PI) / level.size;
          return { x: radius + Math.cos(a) * r, y: radius + Math.sin(a) * r };
        })()
      : {
          x: ((cell % level.size) + 0.5) * cellSize,
          y: (Math.floor(cell / level.size) + 0.5) * cellSize,
        };
  const stableTap = React.useCallback(
    (cell: number) => callbacks.current.onCell(cell),
    [],
  );
  return (
    <View
      style={{
        width: boardWidth,
        height: boardWidth,
        backgroundColor:
          level.cells && level.cells.length < level.size ** 2
            ? theme.ground
            : theme.field,
        borderRadius: level.shape === "rings" ? boardWidth / 2 : maze ? 8 : 16,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: theme.wall,
      }}
    >
      {level.shape === "rings" ? (
        <PolarWalls level={level} width={boardWidth} theme={theme} />
      ) : (
        <StaticLayer
          level={level}
          cellSize={cellSize}
          theme={theme}
          maze={maze}
          onCell={stableTap}
        />
      )}
      <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
        <Svg width={boardWidth} height={boardWidth} pointerEvents="none">
          {path.length > 0 && (
            <SvgPath
              testID="puzzle-trail"
              d={
                path
                  .map((cell, i) => {
                    const p = centre(cell);
                    if (
                      level.shape === "rings" &&
                      i &&
                      Math.floor(cell / level.size) ===
                        Math.floor(path[i - 1] / level.size)
                    ) {
                      const previous = path[i - 1] % level.size,
                        c = cell % level.size,
                        clockwise =
                          (c - previous + level.size) % level.size === 1;
                      const r =
                        (boardWidth / 2) * 0.12 +
                        ((((Math.floor(cell / level.size) + 0.5) * boardWidth) /
                          2) *
                          0.88) /
                          level.size;
                      return `A${r},${r} 0 0 ${clockwise ? 1 : 0} ${p.x},${p.y}`;
                    }
                    return `${i ? "L" : "M"}${p.x},${p.y}`;
                  })
                  .join(" ") + (path.length === 1 ? " l0.01,0" : "")
              }
              fill="none"
              stroke={theme.path}
              strokeWidth={
                level.shape === "rings"
                  ? ((boardWidth * 0.88) / level.size / 2) * 0.46
                  : Math.max(12, Math.min(20, cellSize * 0.4))
              }
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
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
      {/* A leaf input surface keeps native locationX/Y relative to one stable
          target, even when the finger starts over a number or the runner. */}
      <View
        {...responder.panHandlers}
        testID="board-input-surface"
        accessible={false}
        collapsable={false}
        style={{ position: "absolute", inset: 0 }}
      />
    </View>
  );
});

function PolarWalls({
  level,
  width,
  theme,
}: {
  level: BoardLevel;
  width: number;
  theme: Theme;
}) {
  const s = level.size,
    rad = width / 2,
    unit = (rad * 0.88) / s,
    inner = rad * 0.12;
  const point = (r: number, a: number) =>
    `${rad + Math.cos(a) * r},${rad + Math.sin(a) * r}`;
  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={width}
      style={{ position: "absolute" }}
    >
      <Circle
        cx={rad}
        cy={rad}
        r={rad - 2}
        fill={theme.field}
        stroke={theme.wall}
        strokeWidth={4}
      />
      <Circle
        cx={rad}
        cy={rad}
        r={inner}
        fill={theme.ground}
        stroke={theme.wall}
        strokeWidth={3}
      />
      {level.walls.map(([a, b]) => {
        const ar = Math.floor(a / s),
          br = Math.floor(b / s),
          ac = a % s,
          bc = b % s;
        let d: string;
        if (ar !== br) {
          const r = inner + Math.max(ar, br) * unit,
            ang = (ac * 2 * Math.PI) / s;
          d = `M${point(r, ang)} A${r},${r} 0 0 1 ${point(r, ang + (2 * Math.PI) / s)}`;
        } else {
          const ang =
            ((Math.abs(ac - bc) === s - 1 ? 0 : Math.max(ac, bc)) *
              2 *
              Math.PI) /
            s;
          d = `M${point(inner + ar * unit, ang)} L${point(inner + (ar + 1) * unit, ang)}`;
        }
        return (
          <SvgPath
            key={`${a}:${b}`}
            d={d}
            fill="none"
            stroke={theme.wall}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}
