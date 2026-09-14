import { getStroke, type StrokeOptions } from "perfect-freehand";
import { DEFAULT_CHALK_COLOR } from "./theme";

export type WallPoint = {
  x: number;
  y: number;
  pressure?: number;
};

export const DEFAULT_BRUSH: StrokeOptions = {
  size: 14,
  thinning: 0.65,
  smoothing: 0.5,
  streamline: 0.5,
};

export function getStrokeOutline(
  points: WallPoint[],
  options: StrokeOptions = DEFAULT_BRUSH,
) {
  return getStroke(points, options);
}

export function outlineToPath(outline: Array<[number, number]>) {
  if (!outline.length) return "";
  return `${outline
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ")} Z`;
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: WallPoint[],
  color: string = DEFAULT_CHALK_COLOR,
  options: StrokeOptions = DEFAULT_BRUSH,
) {
  const outline = getStrokeOutline(points, options);
  const path = outlineToPath(outline);

  if (!path) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.fill(new Path2D(path));
  ctx.restore();
}
