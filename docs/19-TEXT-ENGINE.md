# 19 — Text Engine

> **Statut : ✅ stable.**

## Purpose

Moteur de rendu et de stylisation du texte, intégré au canvas Skia. Le Text Engine
gère le cycle de vie complet d'un `TextObject` : création, style (via styles prédéfinis
ou paramètres fins), animation d'entrée/sortie, et résolution des polices (système,
bundlées SDK, ou issues d'un `FontPack`). Il est **headless** : l'UI `<TextEditor />`
est un consommateur optionnel ; toutes les mutations passent par le CommandBus.

## Concepts

### Rendu Skia

Le Text Engine délègue le dessin à `@shopify/react-native-skia`. À chaque frame,
la couche Skia lit le `TextObject` courant (style + contenu) et le compose sur le
canvas de prévisualisation. L'export suit le même pipeline de rendu, garantissant
la **parité preview/export** — [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

Les capacités Skia exploitées :

| Fonctionnalité | Usage |
|---|---|
| `SkParagraph` | Rendu multi-ligne, alignement, letter spacing |
| `SkPaint` (stroke) | Contour du texte |
| `SkShader` (gradient) | Dégradés couleur |
| `SkDropShadow` | Ombre portée |
| Clip + paint fill | Fond coloré derrière le texte |

### Styles prédéfinis

Un style prédéfini est un **raccourci nommé** qui résout un `TextStyle` complet.
L'intégrateur peut substituer la valeur de n'importe quel champ via `override`.

| Nom | Caractéristiques principales |
|---|---|
| **Classic** | Police sans-serif neutre, noir sur fond transparent, sans effet |
| **Minimal** | Police fine (weight léger), taille modérée, opacité réduite |
| **Bold** | Grande taille, stroke épais, couleur contrastée |
| **Elegant** | Police serif, interlettrage élargi, couleur claire |
| **Neon** | Couleur saturée, shadow neon (glow), fond sombre semi-transparent |
| **Handwriting** | Famille cursive/handwriting, line-height élargi |
| **Typewriter** | Famille monospace, animation `typewriter` par défaut |

### Font Manager

Le Font Manager résout `TextStyle.fontFamily` en trois niveaux, dans l'ordre de
priorité :

1. **Fonts bundlées SDK** — un ensemble de polices livrées avec le SDK, disponibles
   sans réseau.
2. **Fonts système** — polices présentes sur l'appareil (iOS/Android).
3. **FontPack** — collection de polices distantes téléchargées via
   [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) et enregistrées à l'initialisation.

La liste des polices accessibles et le chemin des `FontPack` sont configurables via
`config.fonts` — [12-CONFIGURATION](./12-CONFIGURATION.md).

### Animations de texte

Une `TextAnimation` est une transition d'entrée ou de sortie appliquée au `TextObject`
sur la durée de son `startTime`/`endTime`. Elle est implémentée comme worklet
Reanimated sur l'UI thread.

| Animation | Comportement |
|---|---|
| `fadeIn` / `fadeOut` | Transition d'opacité |
| `slideUp` / `slideDown` | Translation verticale |
| `slideLeft` / `slideRight` | Translation horizontale |
| `zoom` | Scale de 0 → 1 (entrée) ou 1 → 0 (sortie) |
| `bounce` | Scale avec rebond (spring) |
| `typewriter` | Révélation caractère par caractère |

### Mutations via CommandBus

Toutes les modifications d'un `TextObject` passent par le CommandBus
([ADR-0007](./ADR/0007-mutations-commandbus-undo.md)). L'UI `<TextEditor />`
n'écrit jamais directement dans le store.

## Interfaces (TS)

Les types `TextStyle` et `TextAnimation` sont définis dans
[02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — ils ne sont pas redéfinis ici.

### Commandes texte

```ts
// Crée un nouveau TextObject sur la timeline avec style et position initiaux
interface CreateTextCommand {
  type: "text.create";
  payload: {
    content: string;
    style: Partial<TextStyle>;      // fusionné avec les defaults du style prédéfini
    preset?: TextPreset;            // si fourni, résout un TextStyle de base
    startTime: number;
    endTime: number;
    x: number;
    y: number;
  };
}

// Met à jour le contenu ou la position d'un TextObject existant
interface UpdateTextCommand {
  type: "text.update";
  payload: {
    id: string;
    content?: string;
    x?: number;
    y?: number;
    startTime?: number;
    endTime?: number;
  };
}

// Applique un TextStyle (partiel ou complet) à un TextObject
interface StyleTextCommand {
  type: "text.style";
  payload: {
    id: string;
    style: Partial<TextStyle>;
  };
}

// Assigne ou retire une animation d'entrée/sortie
interface AnimateTextCommand {
  type: "text.animate";
  payload: {
    id: string;
    animation: TextAnimation | null;
  };
}

// Supprime un TextObject de la timeline
interface DeleteTextCommand {
  type: "text.delete";
  payload: { id: string };
}

type TextPreset =
  | "Classic" | "Minimal" | "Bold" | "Elegant"
  | "Neon" | "Handwriting" | "Typewriter";
```

### FontManager (inféré)

```ts
// inféré (hors brief) — interface interne du Font Manager
interface FontManager {
  /** Liste les polices disponibles sur le système (iOS / Android). */
  listSystem(): Promise<string[]>;

  /** Enregistre une police bundlée dans le SDK (chargée au démarrage). */
  registerBundled(name: string, assetPath: string): void;

  /**
   * Charge et enregistre toutes les polices d'un FontPack téléchargé via
   * l'AssetManager.
   */
  loadFromPack(pack: FontPack): Promise<void>;

  /** Résout un fontFamily vers le chemin de fichier chargé, ou null. */
  resolve(fontFamily: string): string | null;
}

// inféré (hors brief) — référence au contrat FontPack de l'AssetManager
interface FontPack {
  id: string;
  fonts: Array<{ name: string; url: string }>;
}
```

### Mapping style prédéfini → TextStyle (inféré)

```ts
// inféré (hors brief) — valeurs représentatives ; l'implémentation finale peut
// différer selon la charte graphique du SDK.
const TEXT_PRESETS: Record<TextPreset, TextStyle> = {
  Classic: {
    fontFamily: "System",
    fontSize: 32,
    color: "#FFFFFF",
    letterSpacingPx: 0,
    lineHeight: 1.2,
    align: "center",
    opacity: 1,
  },
  Minimal: {
    fontFamily: "System",
    fontSize: 24,
    color: "#FFFFFF",
    letterSpacingPx: 1,
    lineHeight: 1.4,
    align: "center",
    opacity: 0.85,
  },
  Bold: {
    fontFamily: "System",
    fontSize: 48,
    color: "#FFFFFF",
    stroke: { color: "#000000", width: 3 },
    letterSpacingPx: 0,
    lineHeight: 1.1,
    align: "center",
    opacity: 1,
  },
  Elegant: {
    fontFamily: "Georgia",
    fontSize: 30,
    color: "#F5F0E8",
    letterSpacingPx: 4,
    lineHeight: 1.5,
    align: "center",
    opacity: 1,
  },
  Neon: {
    fontFamily: "System",
    fontSize: 36,
    color: "#00FFCC",
    shadow: { color: "#00FFCC", blur: 16, offsetX: 0, offsetY: 0 },
    background: { color: "rgba(0,0,0,0.4)", padding: 8, borderRadius: 4 },
    letterSpacingPx: 2,
    lineHeight: 1.2,
    align: "center",
    opacity: 1,
  },
  Handwriting: {
    fontFamily: "Pacifico",   // police bundlée SDK
    fontSize: 34,
    color: "#FFFFFF",
    letterSpacingPx: 1,
    lineHeight: 1.6,
    align: "center",
    opacity: 1,
  },
  Typewriter: {
    fontFamily: "CourierPrime",  // police bundlée SDK
    fontSize: 28,
    color: "#F0E8D0",
    letterSpacingPx: 0,
    lineHeight: 1.3,
    align: "left",
    opacity: 1,
  },
};
```

## Configuration

La configuration du Text Engine passe par `config.fonts`
([12-CONFIGURATION](./12-CONFIGURATION.md)) :

```ts
// Extrait de la config SDK (niveau projet)
{
  fonts: {
    // Polices bundlées supplémentaires à charger au démarrage
    bundled: [
      { name: "Pacifico",    asset: require("./assets/fonts/Pacifico.ttf") },
      { name: "CourierPrime", asset: require("./assets/fonts/CourierPrime.ttf") },
    ],
    // FontPacks distants (téléchargés via AssetManager)
    packs: [
      { id: "premium-pack-01", url: "https://cdn.example.com/fonts/pack01.zip" },
    ],
  },
}
```

Le Text Engine est activé dès que la track `text` du projet contient au moins un
objet, ou que l'intégrateur appelle `text.create`. Il n'est pas conditionné par un
feature flag — [ADR-0009](./ADR/0009-headless-first-config-layers.md).

Mode **headless** : l'intégrateur peut piloter le Text Engine via les commandes
uniquement, sans monter `<TextEditor />`. L'UI est un composant optionnel de la
couche présentation.

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `fonts.enableTextOnPath` | `boolean` | `true` | Active le rendu de texte sur chemin (arc, courbe). |
| `fonts.enableRTL` | `boolean` | `true` | Active le rendu RTL (right-to-left) garanti via `SkParagraph`. |
| `fonts.enableInCanvasSelection` | `boolean` | `true` | Active la sélection et l'édition de texte directement sur le canvas. |
| `fonts.enableMultiAnimation` | `boolean` | `true` | Permet d'assigner une animation d'entrée et une animation de sortie distinctes par `TextObject`. |
| `fonts.enableVariableFonts` | `boolean` | `true` | Active le support des polices variables OpenType (variable fonts). |

## Décisions liées

- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — choix Skia pour le
  rendu canvas (text inclus).
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — mutations text via CommandBus
  et undo/redo.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — Text Engine headless-first,
  UI consommatrice.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — parité rendu Skia
  preview vs export.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `TextObject`, `TextStyle`,
  `TextAnimation`.
- [04-RENDERER](./04-RENDERER.md) — pipeline Skia qui consomme les `TextObject`.
- [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — `FontPack`, téléchargement et cache.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — `config.fonts`, feature flags.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — CommandBus, stores, undo stack.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<TextEditor />`.
