const FALLBACK_CANVAS_THEME = {
  wallBackground: "oklch(0.266 0.065 152.934)",
  chalkWhite: "#f8f5e9",
  chalkPink: "#f3a6b7",
  chalkYellow: "#f3cf72",
  chalkBlue: "#a8d7e8",
  chalkGreen: "#b9d7a8",
  chalkPurple: "#c8b4de",
} as const;

type CanvasThemeKey = keyof typeof FALLBACK_CANVAS_THEME;

const CSS_TOKENS: Record<CanvasThemeKey, string> = {
  wallBackground: "--wall-background",
  chalkWhite: "--chalk-white",
  chalkPink: "--chalk-pink",
  chalkYellow: "--chalk-yellow",
  chalkBlue: "--chalk-blue",
  chalkGreen: "--chalk-green",
  chalkPurple: "--chalk-purple",
};

export function getCanvasTheme() {
  if (typeof window === "undefined") {
    return FALLBACK_CANVAS_THEME;
  }

  const styles = window.getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(FALLBACK_CANVAS_THEME).map(([key, fallback]) => [
      key,
      styles.getPropertyValue(CSS_TOKENS[key as CanvasThemeKey]).trim() ||
        fallback,
    ]),
  ) as typeof FALLBACK_CANVAS_THEME;
}

export const DEFAULT_CHALK_COLOR: string = FALLBACK_CANVAS_THEME.chalkWhite;
