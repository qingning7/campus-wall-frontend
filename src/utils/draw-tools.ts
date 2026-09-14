import { DEFAULT_BRUSH } from "@/canvas/stroke";
import { DARK_CHALK_COLORS, DEFAULT_CHALK_COLOR } from "@/canvas/theme";

export type DrawTool = "pen" | "eraser";

export type BrushSettings = {
  color: string;
  size: number;
};

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  color: DEFAULT_CHALK_COLOR,
  size: Math.round(DEFAULT_BRUSH.size ?? 14),
};

export function getBrushColors() {
  return [
    DARK_CHALK_COLORS.chalkWhite,
    DARK_CHALK_COLORS.chalkPink,
    DARK_CHALK_COLORS.chalkYellow,
    DARK_CHALK_COLORS.chalkBlue,
    DARK_CHALK_COLORS.chalkGreen,
    DARK_CHALK_COLORS.chalkPurple,
  ];
}

export const BRUSH_SIZE_MIN = 2;
export const BRUSH_SIZE_MAX = 40;
export const BRUSH_SIZE_STEP = 1;
