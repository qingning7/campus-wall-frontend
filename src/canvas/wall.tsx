import { useEffect, useRef, type PointerEventHandler } from "react";
import { DEFAULT_BRUSH, drawStroke, type WallPoint } from "./stroke";
import { DEFAULT_CHALK_COLOR, getDisplayChalkColor } from "./theme";
import type { StrokeOptions } from "perfect-freehand";
import { useTheme } from "@/contexts/ThemeContext";

export const WALL_WIDTH = 2400;
export const WALL_HEIGHT = 1400;
export const GRID_SIZE = 100;

type PaintedStroke = {
  points: WallPoint[];
  color?: string;
  size?: number;
};

type StrokeItem = WallPoint[] | PaintedStroke;

type WallProps = {
  strokes?: StrokeItem[];
  liveStrokes?: WallPoint[][];
  currentStroke?: WallPoint[];
  onPointerDown?: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove?: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp?: PointerEventHandler<HTMLCanvasElement>;
  onPointerLeave?: PointerEventHandler<HTMLCanvasElement>;
  onPointerCancel?: PointerEventHandler<HTMLCanvasElement>;
  strokeColor?: string;
  brush?: StrokeOptions;
};

export function Wall({
  strokes = [],
  liveStrokes = [],
  currentStroke = [],
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  strokeColor = DEFAULT_CHALK_COLOR,
  brush = DEFAULT_BRUSH,
}: WallProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${WALL_WIDTH}px`;
    canvas.style.height = `${WALL_HEIGHT}px`;
    canvas.width = WALL_WIDTH * dpr;
    canvas.height = WALL_HEIGHT * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WALL_WIDTH, WALL_HEIGHT);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    redrawWall(
      ctx,
      WALL_WIDTH,
      WALL_HEIGHT,
      strokes,
      liveStrokes,
      currentStroke,
      null,
      getDisplayChalkColor(strokeColor, theme),
      brush,
      theme,
    );
  }, [strokes, liveStrokes, currentStroke, strokeColor, brush, theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
    />
  );
}

export function redrawWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: StrokeItem[],
  liveStrokes: WallPoint[][] = [],
  currentStroke: WallPoint[] = [],
  background: string | null = null,
  color: string = DEFAULT_CHALK_COLOR,
  brush: StrokeOptions = DEFAULT_BRUSH,
  theme: "light" | "dark" = "dark",
) {
  ctx.clearRect(0, 0, width, height);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  for (const stroke of strokes) {
    const resolved = Array.isArray(stroke)
      ? { points: stroke, color, brush }
      : {
          points: stroke.points,
          color: stroke.color ?? color,
          brush:
            typeof stroke.size === "number"
              ? { ...brush, size: stroke.size }
              : brush,
        };

    drawStroke(
      ctx,
      resolved.points,
      getDisplayChalkColor(resolved.color, theme),
      resolved.brush,
    );
  }

  for (const liveStroke of liveStrokes) {
    drawStroke(ctx, liveStroke, color, brush);
  }

  if (currentStroke.length) {
    drawStroke(ctx, currentStroke, color, brush);
  }
}

export function getCanvasPoint(
  event: { clientX: number; clientY: number; pressure?: number },
  canvas: HTMLCanvasElement,
): WallPoint {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure ?? 0.5,
  };
}
