/**
 * Theming du SDK : design tokens + ThemeProvider + useTheme. Headless-first : les
 * composants par défaut consomment ces tokens ; un intégrateur fournit son thème.
 * Voir docs/24-UI-COMPONENTS.md, ADR-0009.
 */
import React, { createContext, useContext } from "react";

export interface MediaStudioTheme {
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    accent: string;
  };
  radii: { sm: number; md: number; lg: number };
  /** Échelle d'espacement (base 8) : `spacing(2)` → 16. */
  spacing(units: number): number;
}

const SPACING_BASE = 8;
const spacing = (units: number): number => units * SPACING_BASE;

export const darkTheme: MediaStudioTheme = {
  colors: {
    background: "#0b0b0c",
    surface: "#161618",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.6)",
    accent: "#0a84ff",
  },
  radii: { sm: 8, md: 12, lg: 16 },
  spacing,
};

export const lightTheme: MediaStudioTheme = {
  colors: {
    background: "#ffffff",
    surface: "#f2f2f7",
    text: "#11181c",
    textMuted: "#687076",
    accent: "#0a84ff",
  },
  radii: { sm: 8, md: 12, lg: 16 },
  spacing,
};

export const defaultTheme = darkTheme;

const ThemeContext = createContext<MediaStudioTheme>(defaultTheme);

export interface ThemeProviderProps {
  theme?: MediaStudioTheme;
  children: React.ReactNode;
}

export function ThemeProvider({
  theme = defaultTheme,
  children,
}: ThemeProviderProps): React.JSX.Element {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Accès au thème courant (défaut sombre). */
export function useTheme(): MediaStudioTheme {
  return useContext(ThemeContext);
}
