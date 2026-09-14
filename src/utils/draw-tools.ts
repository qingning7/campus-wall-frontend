import { DEFAULT_BRUSH } from "@/canvas/stroke";
import { DEFAULT_CHALK_COLOR, getCanvasTheme } from "@/canvas/theme";

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
  const {
    chalkWhite,
    chalkPink,
    chalkYellow,
    chalkBlue,
    chalkGreen,
    chalkPurple,
  } = getCanvasTheme();

  return [
    chalkWhite,
    chalkPink,
    chalkYellow,
    chalkBlue,
    chalkGreen,
    chalkPurple,
  ];
}

export const BRUSH_SIZE_MIN = 2;
export const BRUSH_SIZE_MAX = 40;
export const BRUSH_SIZE_STEP = 1;
