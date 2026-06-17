# 24 — UI Components

> **Statut : ✅ stable.**

## Purpose

Catalogue des **composants d'UI par défaut** fournis par le package `ui` du SDK.
Chaque composant est entièrement remplaçable, ne contient **aucune logique métier**
et se limite à consommer les hooks headless exposés par le SDK. Ils constituent une
implémentation de référence du contrat headless-first
([ADR-0009](./ADR/0009-headless-first-config-layers.md)) : tout ce qu'ils font,
un intégrateur peut le refaire.

La règle d'or : **l'UI suit la logique, jamais l'inverse.**

## Concepts

### Headless-first et override en 4 niveaux

Les composants par défaut s'inscrivent dans le modèle d'override à 4 niveaux défini
dans [12-CONFIGURATION](./12-CONFIGURATION.md) :

| Niveau | Ce qu'on fait | Composants concernés |
|--------|--------------|----------------------|
| **0 — Flags** | `enableAudio={false}` → `<AudioPicker />` non monté. | Tous (conditionné par les `capabilities`). |
| **1 — Tokens** | Passer un `Theme` partiel via `setTheme()`. | Tous (couleurs, fonts, radius…). |
| **2 — Slots** | Substituer un composant via `slots.AudioPicker = MyPicker`. | Un composant à la fois. |
| **3 — Headless** | Ne pas utiliser le package `ui` du tout ; piloter les hooks. | Intégralité de l'UI. |

### Le composant orchestrateur

`<MediaStudio />` est le **composant d'entrée unique** : il enchaîne lui-même les
étapes (Caméra → Éditeur → Aperçu) via une **machine à états interne**, sans aucun
routeur ([26-STUDIO-FLOW](./26-STUDIO-FLOW.md)). L'intégrateur monte ce seul composant ;
il n'a pas à câbler les sous-vues ni leurs events. Les composants ci-dessous restent
**exposés et composables** pour qui veut piloter les étapes lui-même.

### Catalogue des composants

| Composant | Module associé | Slot correspondant |
|-----------|---------------|-------------------|
| `<MediaStudioProvider />` | [26-STUDIO-FLOW](./26-STUDIO-FLOW.md) | _(racine — détient jobs + vignette globale)_ |
| `<MediaStudio />` | [26-STUDIO-FLOW](./26-STUDIO-FLOW.md) | _(orchestrateur — non slotable)_ |
| `<CameraView />` | [16-CAMERA](./16-CAMERA.md) | `slots.CameraView` |
| `<PhotoEditor />` | [17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md) | `slots.PhotoEditor` |
| `<VideoEditor />` | [18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md) | `slots.VideoEditor` |
| `<Timeline />` | [05-TIMELINE](./05-TIMELINE.md) | `slots.Timeline` |
| `<TextEditor />` | [19-TEXT-ENGINE](./19-TEXT-ENGINE.md) | `slots.TextEditor` |
| `<StickerPicker />` | [20-STICKER-ENGINE](./20-STICKER-ENGINE.md) | `slots.StickerPicker` |
| `<FilterPicker />` | [21-FILTER-ENGINE](./21-FILTER-ENGINE.md) | `slots.FilterPicker` |
| `<AudioPicker />` | [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md) | `slots.AudioPicker` |
| `<ExportPanel />` | [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) | `slots.ExportPanel` |
| `<ExportProgress />` | [27-BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md) | `slots.ExportProgress` |
| `<ToolBar />` | _(transversal)_ | `slots.Toolbar` |

### Éditeur unifié — même design photo et vidéo

L'éditeur Photo et l'éditeur Vidéo partagent **un seul habillage** : barre d'outils,
tiroir d'outils, panneau de calques/timeline et zone d'aperçu sont **identiques** pour
la cohérence visuelle. Seuls les **outils proposés** et l'affichage de la timeline
s'adaptent au contenu (la timeline apparaît dès que le projet a une durée — vidéo ou
photo animée). Le thème (tokens) s'applique uniformément aux deux.
→ [17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md), [18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md).

### `<MediaStudioProvider />` — racine & API impérative

Monté **une fois à la racine** de l'app, il détient l'état global (jobs, progression,
drafts) et expose `useMediaStudio()` → `open()/close()/jobs/activeProgress`. Il
**présente l'éditeur en overlay plein écran** (portail) au-dessus de ta navigation —
pas de routeur. C'est le mode recommandé pour ouvrir l'éditeur **de n'importe où** et
afficher la progression **sur tous les écrans**. → [26-STUDIO-FLOW](./26-STUDIO-FLOW.md),
[ADR-0017](./ADR/0017-root-provider-portal-presentation.md).

### `<ExportProgress />` — vignette de progression globale

Rendu **par le Provider racine**, il affiche la **vignette + le %** de l'export en
arrière-plan **au-dessus de tous les écrans**, à la TikTok, **sans bloquer**
l'interaction : l'utilisateur continue d'éditer/naviguer pendant le rendu.
→ [27-BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md).

### Theming — design tokens

L'apparence des composants est entièrement pilotée par le type `Theme` défini dans
[12-CONFIGURATION](./12-CONFIGURATION.md). Les tokens constituent la seule surface
de personnalisation de niveau 1 : il n'y a pas de surcharge CSS arbitraire.

```ts
// Forme minimale du brief — acceptée telle quelle
MediaStudio.setTheme({
  colors: {
    primary: "#1A73E8",
    background: "#0D0D0D",
    surface: "#1C1C1E",
    accent: "#FF375F",
    text: "#FFFFFF",
    textMuted: "#8E8E93",
    border: "#3A3A3C",
    danger: "#FF3B30",
  },
  fonts: { ui: "Inter", mono: "JetBrains Mono" },
  borderRadius: 12,   // s'applique à toutes les cartes, boutons et panneaux
});
```

`setTheme` est **réactif** : l'UI se met à jour sans remount. Les tokens sont
**fusionnés** avec le thème par défaut (merge partiel, on ne surcharge que ce qu'on
précise).

Extensions optionnelles du token `Theme` (alignées sur [12-CONFIGURATION](./12-CONFIGURATION.md)) :

- `radius` — échelle détaillée `{ sm, md, lg, full }` (prioritaire sur `borderRadius`
  si fourni).
- `spacing` — fonction `(n: number) => number` pour l'échelle d'espacement.
- `typography` — tokens `body`, `title`, `caption`.
- `iconSet` — jeu d'icônes remplaçable.

### Remplacement par slot

Un slot remplace **un composant précis** sans toucher au reste. Le composant de
substitution reçoit un *prop bag* typé : état courant + actions issues du controller
headless sous-jacent.

```tsx
<MediaStudio
  flow={{ initialMode: "video" }}
  slots={{
    AudioPicker: ({ tracks, onSelectTrack, onAddTrack, theme }) => (
      <MyCustomAudioPicker
        tracks={tracks}
        onSelect={onSelectTrack}
        onAdd={onAddTrack}
        accentColor={theme.colors.accent}
      />
    ),
  }}
/>
```

L'intégrateur obtient la logique complète sans écrire une ligne de controller.

### Mode headless — zéro UI

Lorsqu'aucun composant par défaut n'est souhaité, l'intégrateur importe directement
les hooks :

```ts
import {
  createEditor,
  useEditor,
  useTimeline,
  useRuntime,
} from "@media-studio/sdk/headless";
```

L'UI par défaut (package `ui`) est construite au-dessus de ces mêmes hooks :
aucune capacité n'est cachée derrière elle.

## Interfaces (TS)

```ts
// Prop bags représentatifs — chaque composant expose le sien.
// La liste exhaustive vit dans le package @media-studio/sdk/ui/types.

interface AudioPickerProps {
  tracks: AudioObject[];
  onSelectTrack: (trackId: string) => void;
  onAddTrack: (source: AudioSource) => void;
  onDeleteTrack: (trackId: string) => void;
  theme: Theme;
}

interface TimelineProps {
  tracks: VideoTrack[];
  currentTimeMs: number;
  durationMs: number;
  zoom: number;
  onSeek: (timeMs: number) => void;
  onZoomChange: (zoom: number) => void;
  theme: Theme;
}

interface ExportPanelProps {
  exportConfig: ExportConfig;
  progress: number | null;    // null = pas en cours, 0–1 = en cours
  onExport: (config: ExportConfig) => void;
  onCancel: () => void;
  theme: Theme;
}

interface ToolbarProps {
  selection: EditorObject | null;
  canUndo: boolean;
  canRedo: boolean;
  execute: (command: string, payload?: unknown) => void;
  undo: () => void;
  redo: () => void;
  theme: Theme;
}

// Déclaration des slots — forme complète (inféré — hors brief)
interface MediaStudioSlots {
  CameraView?:    ComponentType<CameraViewProps>;
  PhotoEditor?:   ComponentType<PhotoEditorProps>;
  VideoEditor?:   ComponentType<VideoEditorProps>;
  Timeline?:      ComponentType<TimelineProps>;
  TextEditor?:    ComponentType<TextEditorProps>;
  StickerPicker?: ComponentType<StickerPickerProps>;
  FilterPicker?:  ComponentType<FilterPickerProps>;
  AudioPicker?:   ComponentType<AudioPickerProps>;
  ExportPanel?:   ComponentType<ExportPanelProps>;
  Toolbar?:       ComponentType<ToolbarProps>;
}
```

## Configuration

```ts
// Trois points d'entrée de configuration pour les composants UI :

// 1. À l'initialisation — thème global et capabilities
await MediaStudio.initialize({
  theme: { colors: { primary: "#fff" }, borderRadius: 8 },
  capabilities: {
    enableAudio: false,       // <AudioPicker /> non monté
    enableTransitions: true,
  },
});

// 2. Au montage — slots et thème local
<MediaStudio
  flow={{ initialMode: "video" }}
  slots={{ ExportPanel: MyExportPanel }}
  theme={{ colors: { accent: "#FF0000" } }}
/>

// 3. À chaud — mise à jour réactive
MediaStudio.setTheme({ borderRadius: 16 });   // tous les composants se mettent à jour
```

Les `capabilities` conditionnent le **montage** des composants : un flag `false`
empêche le composant et son controller sous-jacent d'être instanciés.

## Capacités avancées

- Les composants par défaut couvrent les modes `photo` et `video` (y compris la configuration « audio seul » obtenue via le flag `enableCamera: false` et `enableAudio: true`).
- Le theming repose sur les **tokens** définis dans `Theme` ; des surcharges de styles
  arbitraires via StyleSheet peuvent être appliquées en complément des tokens.
- Un slot peut recevoir **plusieurs overrides partiels composés** sur un même slot ;
  la composition de plusieurs substitutions est supportée.
- L'`iconSet` (extension `Theme`) est surchargeable composant par composant, en plus
  du remplacement global.
- Les prop bags sont **stables** et additifs : de nouveaux champs peuvent être ajoutés
  en version mineure sans changement de version majeure.

## Décisions liées

- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — architecture headless-first, couches de configuration.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — les actions exposées dans les prop bags passent par le CommandBus.
- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — composants natifs (`<CameraView />`) exposés via Expo Modules.

## Cross-refs

- [12-CONFIGURATION](./12-CONFIGURATION.md) — contrat complet du theming (tokens `Theme`), slots, headless, capabilities.
- [05-TIMELINE](./05-TIMELINE.md) — module associé à `<Timeline />`.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — module associé à `<ExportPanel />`.
- [16-CAMERA](./16-CAMERA.md) — module associé à `<CameraView />`.
- [17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md) — module associé à `<PhotoEditor />`.
- [18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md) — module associé à `<VideoEditor />`.
- [19-TEXT-ENGINE](./19-TEXT-ENGINE.md) — module associé à `<TextEditor />`.
- [20-STICKER-ENGINE](./20-STICKER-ENGINE.md) — module associé à `<StickerPicker />`.
- [21-FILTER-ENGINE](./21-FILTER-ENGINE.md) — module associé à `<FilterPicker />`.
- [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md) — module associé à `<AudioPicker />`.
