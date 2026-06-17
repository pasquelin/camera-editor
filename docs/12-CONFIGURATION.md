# 12 — Configuration (contrat de paramétrage)

## Purpose

Définir **le contrat de paramétrage complet** du SDK : comment un intégrateur
adapte Media Studio à son projet, depuis « j'active deux features et je change la
couleur d'accent » jusqu'à « je remplace toute l'UI et je pilote le moteur en
headless ». C'est le document de référence de l'exigence **« tout paramétrable »**.

## Concepts — le modèle d'override à 4 niveaux

Le paramétrage est gradué : chaque niveau est plus puissant et plus engageant que
le précédent. On ne paie la complexité que du niveau qu'on utilise.

```
Niveau 0 — Capability flags     activer / désactiver des sous-systèmes
Niveau 1 — Design tokens        thémer l'UI par défaut (couleurs, fonts, radius…)
Niveau 2 — Slots / render-props remplacer un composant précis de l'UI
Niveau 3 — Headless             zéro UI fournie : on pilote les controllers/hooks
```

> Principe directeur : **headless-first**. La logique vit dans des controllers sans
> UI ; l'UI par défaut n'est qu'un *consommateur* de cette logique. Tout ce que
> fait l'UI par défaut, un intégrateur peut le refaire. → [ADR-0009](./ADR/0009-headless-first-config-layers.md).

## Interfaces (TS)

### Configuration d'initialisation (globale, une fois)

```ts
interface MediaStudioConfig {
  // Licence — optionnelle (open-core sans clé)
  licenseKey?: string;
  offlineCache?: boolean;          // active le cache local de validation JWT
  offlineCacheTtlDays?: number;    // TTL du cache hors-ligne, défaut : 7 jours

  // Adapters injectés (sinon valeurs Expo par défaut)
  storage?: StorageAdapter;        // défaut: expo-file-system + AsyncStorage
  network?: NetworkAdapter;

  // Thème global (design tokens)
  theme?: Partial<Theme>;

  // Capacités par défaut (surchargées par les props du composant)
  capabilities?: Partial<Capabilities>;

  // Catalogues remplaçables
  fonts?: FontSource[];            // fonts bundlées additionnelles
  filters?: FilterDefinition[];    // catalogue de filtres custom
  musicLibrary?: MusicSource;      // bibliothèque audio custom

  // Parcours du composant Studio (étapes, toggle, aperçu) — entièrement paramétrable
  flow?: StudioFlowConfig;         // → 26-STUDIO-FLOW

  // Export en arrière-plan (jobs)
  jobs?: JobsConfig;               // → 27-BACKGROUND-JOBS

  // Valeurs par défaut des paramètres runtime (entièrement ajustables par l'intégrateur)
  limits?: Partial<EditorLimits>;
}

await MediaStudio.initialize(config: MediaStudioConfig): Promise<void>;
```

### Niveau 0 bis — Parcours Studio (étapes & aperçu)

Le composant `<MediaStudio />` orchestre **lui-même** les étapes ; on les paramètre
sans toucher à la navigation de l'app hôte ([26-STUDIO-FLOW](./26-STUDIO-FLOW.md)).
**Tout est optionnel**, y compris l'aperçu :

```ts
interface StudioFlowConfig {
  steps?: ("capture" | "edit" | "preview")[];  // défaut ["capture","edit","preview"]
  initialStep?: "capture" | "edit" | "preview"; // défaut "capture"
  initialMode?: "photo" | "video";              // défaut "video"
  allowModeToggle?: boolean;                     // toggle Photo/Vidéo, défaut true
  preview?: boolean;                             // afficher l'aperçu, défaut true
  autoExportOnFinish?: boolean;                  // export auto en fin d'édition, défaut true
}

interface JobsConfig {
  maxConcurrent?: number;    // jobs d'export simultanés, défaut 1
  showThumbnail?: boolean;   // vignette de progression, défaut true
}

// Exemples
<MediaStudio flow={{ preview: false }} />                       // pas d'aperçu
<MediaStudio flow={{ steps: ["edit", "preview"] }} media={…} /> // démarre sur l'éditeur
<MediaStudio flow={{ steps: ["capture"] }} />                   // caméra seule
```

### Niveau 0 — Capability flags

Activent/désactivent des sous-arbres entiers. Un flag `false` ne **monte jamais**
la couche correspondante (ni JS, ni natif).

```ts
interface Capabilities {
  enableCamera: boolean;
  enableAudio: boolean;
  enableFilters: boolean;
  enableText: boolean;
  enableStickers: boolean;
  enableTimeline: boolean;
  enableTransitions: boolean;
  enableExport: boolean;
}

// Sur le composant racine :
<MediaStudio flow={{ initialMode: "video" }} enableCamera enableAudio enableFilters />
```

Certaines capacités sont **gated par licence** (cf. [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md)) :
demander `export 4K` ou `H.265` sans plan Pro lève un avertissement et retombe sur
la capacité libre la plus proche, sans crash.

### Niveau 1 — Design tokens

```ts
// Descripteur d'une police bundlée ou distante
type FontSource =
  | { kind: "bundled"; name: string; path: string }         // asset local
  | { kind: "google";  family: string; weights?: number[] } // Google Fonts
  | { kind: "url";     name: string; url: string };         // URL distante

// MusicSource défini dans 22-AUDIO-ENGINE

// Tokens typographiques d'une variante (body / title / caption)
interface TextTokens {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: "400" | "500" | "600" | "700";
  lineHeight?: number;
  letterSpacing?: number;
}

// Jeu d'icônes remplaçable (chaque valeur = composant React Native)
type IconSet = Record<string, ComponentType<{ size?: number; color?: string }>>;

interface Theme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
    danger: string;
  };
  fonts: { ui: string; mono?: string };
  borderRadius: number;              // forme du brief — alimente `radius.md`
  radius?: { sm: number; md: number; lg: number; full: number }; // échelle étendue (optionnelle)
  spacing?: (n: number) => number;   // échelle d'espacement (ex. n => n * 4)
  typography?: {
    body: TextTokens;
    title: TextTokens;
    caption: TextTokens;
  };
  iconSet?: IconSet;                 // jeu d'icônes remplaçable
}

MediaStudio.setTheme(partial: Partial<Theme>): void;   // runtime, réactif
```

La forme **minimale du brief** est le sous-ensemble accepté tel quel ; les autres
tokens (`radius`, `spacing`, `typography`, `iconSet`) sont des **extensions
additives** pour aller plus loin :

```ts
// forme minimale (brief) — valide
MediaStudio.setTheme({
  colors: { primary: "#fff", background: "#000", accent: "#f00" },
  fonts: { ui: "Inter" },
  borderRadius: 8,
});
```

Les tokens sont **partiels et fusionnés** avec le thème par défaut : on ne surcharge
que ce qu'on veut. `setTheme` est réactif (l'UI se met à jour sans remount).

### Niveau 2 — Slots / render-props

Chaque composant d'UI expose un **slot nommé**. Remplacer un slot = fournir son
propre composant, qui reçoit un *prop bag* typé (l'état + les actions). On garde
toute la logique, on ne change que le rendu.

```ts
interface MediaStudioSlots {
  Toolbar?: ComponentType<ToolbarProps>;
  Timeline?: ComponentType<TimelineProps>;
  FilterPicker?: ComponentType<FilterPickerProps>;
  TextEditor?: ComponentType<TextEditorProps>;
  StickerPicker?: ComponentType<StickerPickerProps>;
  AudioPicker?: ComponentType<AudioPickerProps>;
  ExportPanel?: ComponentType<ExportPanelProps>;
  CameraControls?: ComponentType<CameraControlsProps>;
  // ... un slot par composant listé dans le package `ui`
}

<MediaStudio
  flow={{ initialMode: "video" }}
  slots={{
    Toolbar: MyToolbar,                 // remplace entièrement la toolbar
    ExportPanel: ({ exportConfig, onExport, progress }) => <MyExport … />,
  }}
/>
```

Exemple de prop bag (contrat stable, fourni par le controller headless sous-jacent) :

```ts
interface ToolbarProps {
  selection: EditorObject | null;
  canUndo: boolean;
  canRedo: boolean;
  execute: (command: string, payload?: unknown) => void;
  undo: () => void;
  redo: () => void;
  theme: Theme;
}
```

### Niveau 3 — Headless (API sans UI)

On n'instancie aucun composant `MediaStudio` : on consomme directement les
controllers/hooks. C'est le mode pour les intégrateurs qui veulent leur propre UI
de A à Z.

```ts
import { createEditor, useEditor, useTimeline, useRuntime } from "@media-studio/sdk/headless";

const editor = await createEditor(config);   // expose Core + Runtime, zéro UI

// Dans un composant React :
const { project, selection, execute, undo, redo } = useEditor(editor);
const { play, pause, seek, currentTime, isPlaying } = useRuntime(editor);
const { tracks, zoom, snap } = useTimeline(editor);

execute("text.create", { content: "Hello" });
play();
```

L'UI par défaut (package `ui`) est **construite au-dessus de ces mêmes hooks** :
c'est la garantie qu'aucune capacité n'est cachée derrière l'UI.

## Configuration runtime vs init

| Quand | Quoi | Comment |
|-------|------|---------|
| **Init** (une fois) | licence, adapters, catalogues, limites | `MediaStudio.initialize(config)` |
| **Montage** (par éditeur) | flow (initialMode, steps…), capabilities, slots, callbacks | props du composant `<MediaStudio>` |
| **Runtime** (à chaud) | thème, sélection, commandes | `setTheme()`, hooks, `editor.execute()` |

## Recette — « adapter le module à mon projet »

1. **Le strict minimum** : `initialize({ })` puis `<MediaStudio flow={{ initialMode: "photo" }} />`.
2. **Aux couleurs de mon app** : passer un `theme` partiel à l'init ou `setTheme`.
3. **Désactiver ce dont je n'ai pas besoin** : flags `enableX={false}`.
4. **Remplacer un écran** : fournir un `slots.ExportPanel`.
5. **Mon UI complète** : passer en `@media-studio/sdk/headless`.
6. **Ajouter une feature** : enregistrer un plugin (type d'objet + commandes + panel).
   → [06-PLUGIN-API](./06-PLUGIN-API.md).

## Valeurs par défaut et ajustements runtime

L'objet `EditorLimits` expose les **valeurs par défaut entièrement ajustables** des
paramètres de capacité de l'éditeur. Ce ne sont pas des plafonds imposés : l'intégrateur
peut librement les augmenter ou les abaisser en fonction de ses besoins et des
contraintes matérielles de ses utilisateurs.

Les capacités Pro/Enterprise demandées sans licence valide retombent en mode gracieux
(warning + fallback), jamais en crash.

Le thème est un système de **tokens**, pas de CSS arbitraire : on paramètre l'apparence
dans les axes prévus (couleurs, fonts, radius, spacing, icônes).

```ts
interface EditorLimits {
  maxVideoTracks: number;   // défaut : 3 (configurable)
  maxAudioTracks: number;   // défaut : 5 (configurable)
  previewFps: number;       // défaut : 30 (configurable)
  undoStackSize: number;    // défaut : 50 (configurable)
}
```

## Décisions liées

- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — headless-first + couches de configuration.
- [ADR-0011](./ADR/0011-licensing-injected-interface.md) — capacités gated, licence optionnelle.

## Cross-refs

- [00-VISION](./00-VISION.md) — l'exigence « tout paramétrable ».
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — comment les hooks exposent l'état.
- [06-PLUGIN-API](./06-PLUGIN-API.md) — extension par plugin (le niveau au-delà des slots).
