export const DARK_CHALK_COLORS = {
  wallBackground: "oklch(0.266 0.065 152.934)",
  chalkWhite: "#f8f5e9",
  chalkPink: "#f3a6b7",
  chalkYellow: "#f3cf72",
  chalkBlue: "#a8d7e8",
  chalkGreen: "#b9d7a8",
  chalkPurple: "#c8b4de",
} as const;

export const LIGHT_CHALK_COLORS = {
  wallBackground: "oklch(0.266 0.065 152.934)",
  chalkWhite: "#34422f",
  chalkPink: "#9d3f58",
  chalkYellow: "#8a6517",
  chalkBlue: "#2b7189",
  chalkGreen: "#477a42",
  chalkPurple: "#6d508c",
} as const;

type CanvasThemeKey = keyof typeof DARK_CHALK_COLORS;

export function getDisplayChalkColor(color: string, theme: "light" | "dark") {
  const colorKey = (Object.keys(DARK_CHALK_COLORS) as CanvasThemeKey[]).find(
    (key) =>
      DARK_CHALK_COLORS[key].toLowerCase() === color.toLowerCase() ||
      LIGHT_CHALK_COLORS[key].toLowerCase() === color.toLowerCase(),
  );

  if (!colorKey) {
    return color;
  }

  return theme === "dark"
    ? DARK_CHALK_COLORS[colorKey]
    : LIGHT_CHALK_COLORS[colorKey];
}

export const DEFAULT_CHALK_COLOR: string = DARK_CHALK_COLORS.chalkWhite;
