import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// Documentation publique du SDK Media Studio (distincte du blueprint interne docs/).
// Voir docs/25-DEVELOPER-DOCS.md.
const config: Config = {
  title: "Media Studio SDK",
  tagline: "Création, édition et export photo/vidéo pour React Native + Expo",
  favicon: "img/favicon.ico",
  url: "https://media-studio.dev",
  baseUrl: "/",
  onBrokenLinks: "warn",
  i18n: { defaultLocale: "fr", locales: ["fr"] },
  presets: [
    [
      "classic",
      {
        docs: { sidebarPath: "./sidebars.ts", routeBasePath: "/" },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Media Studio",
      items: [{ type: "docSidebar", sidebarId: "docs", position: "left", label: "Documentation" }],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
