import { DEFAULT_BRUSH } from "@/canvas/stroke";

export type DrawTool = "pen" | "eraser";

export type BrushSettings = {
  color: string;
  size: number;
};

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  color: "#111827",
  size: Math.round(DEFAULT_BRUSH.size ?? 14),
};

export const BRUSH_COLORS = [
  "#111827",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#ffffff",
] as const;

export const BRUSH_SIZE_MIN = 2;
export const BRUSH_SIZE_MAX = 40;
export const BRUSH_SIZE_STEP = 1;
