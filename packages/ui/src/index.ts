/**
 * @media-studio/ui — couche React du SDK Media Studio : Provider racine, hook
 * impératif, vignette d'export et coquille d'éditeur (headless-first). Les slots
 * (preview Skia, caméra) sont fournis par l'intégrateur. Voir docs/24, 26, 27.
 */
export {
  MediaStudioProvider,
  useMediaStudio,
  type MediaStudioContextValue,
  type MediaStudioProviderProps,
} from "./provider";
export { ExportProgress, type ExportProgressProps } from "./export-progress";
export { MediaStudio, type MediaStudioProps } from "./media-studio";
export {
  ThemeProvider,
  useTheme,
  defaultTheme,
  darkTheme,
  lightTheme,
  type MediaStudioTheme,
  type ThemeProviderProps,
} from "./theme";
