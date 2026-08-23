import { useEffect, useRef, type PointerEventHandler } from "react";
import { DEFAULT_BRUSH, drawStroke, type WallPoint } from "./stroke";
import type { StrokeOptions } from "perfect-freehand";

export const WALL_WIDTH = 2400;
export const WALL_HEIGHT = 1400;
export const GRID_SIZE = 100;

type WallProps = {
  strokes?: WallPoint[][];
  currentStroke?: WallPoint[];
  onPointerDown?: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove?: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp?: PointerEventHandler<HTMLCanvasElement>;
  onPointerLeave?: PointerEventHandler<HTMLCanvasElement>;
  onPointerCancel?: PointerEventHandler<HTMLCanvasElement>;
};

export function Wall({
  strokes = [],
  currentStroke = [],
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
}: WallProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, WALL_WIDTH, WALL_HEIGHT);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    redrawWall(ctx, WALL_WIDTH, WALL_HEIGHT, strokes, currentStroke);
  }, [strokes, currentStroke]);

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
  strokes: WallPoint[][],
  currentStroke: WallPoint[] = [],
  background = "#f8fafc",
  color = "#111827",
  brush: StrokeOptions = DEFAULT_BRUSH,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (const stroke of strokes) {
    drawStroke(ctx, stroke, color, brush);
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
