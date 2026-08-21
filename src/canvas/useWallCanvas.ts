import { useCallback, useEffect, useRef } from "react";
import {
  WALL_HEIGHT,
  WALL_WIDTH,
  drawWallBackground,
  drawSegment,
  getCanvasPoint,
} from "./wall-canvas";

export function useWallCanvas(roomId: string | undefined, enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!roomId || !enabled) return;

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
    drawWallBackground(ctx);
  }, [roomId, enabled]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const canvas = event.currentTarget;
      const point = getCanvasPoint(event, canvas);
      if (!point) return;

      canvas.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
      lastPointRef.current = point;
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || !isDrawingRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const point = getCanvasPoint(event, canvas);
      if (!point || !lastPointRef.current) return;

      drawSegment(ctx, lastPointRef.current, point);
      lastPointRef.current = point;
    },
    [enabled],
  );

  const finishDrawing = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      isDrawingRef.current = false;
      lastPointRef.current = null;

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
    },
    [],
  );

  return {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishDrawing,
    onPointerCancel: finishDrawing,
    wallWidth: WALL_WIDTH,
    wallHeight: WALL_HEIGHT,
  };
}
