# 20 — Sticker Engine

> **Statut : ✅ stable.**

## Purpose

Moteur de gestion des stickers multi-formats. Le Sticker Engine gère l'affichage, la
manipulation gestuelle (drag, rotation, scale, opacité) et le cycle de vie des
`StickerObject` sur le canvas. Il supporte quatre formats de source (PNG, SVG, GIF,
Lottie) avec un pipeline de rendu adapté à chacun. Toutes les mutations sont **atomiques
via le CommandBus** — les gestes Reanimated ne commitent qu'en fin d'interaction.
L'UI `<StickerPicker />` est un consommateur optionnel ; le moteur est **headless**.

## Concepts

### Formats de rendu

Le Sticker Engine choisit son pipeline de rendu selon `StickerObject.format` :

| Format | Rendu | Remarques |
|---|---|---|
| **PNG** | Image Skia (`SkImage`) | Rendu statique, support de la transparence |
| **SVG** | `react-native-svg` ou rasterisation Skia | Scalable sans perte de qualité |
| **GIF** | Décodage multi-frames, lecture séquencée | Synchronisé à la clock Runtime |
| **Lottie** | `lottie-react-native`, rendu animé JSON | Animations vectorielles complexes |

> Les détails d'implémentation du décodage GIF (stratégie de cache frames) et du
> rendu SVG (rasterisation vs. composant natif) sont **inférés (hors brief)** et
> seront précisés à l'implémentation.

### Gestes et Reanimated

Les transformations gestuelles (drag, rotate, scale) sont pilotées par des worklets
Reanimated sur l'**UI thread**, garantissant 60/120 fps sans passer par le JS thread.
Les gestes peuvent être combinés simultanément via `Gesture.Simultaneous` (pan + pinch
+ rotation en même temps). Le principe est :

1. **Pendant le geste** : les `SharedValue` `x`, `y`, `rotation`, `scale` sont mises
   à jour en worklet — aucune commande n'est émise, le store n'est pas modifié.
2. **En fin de geste** (`onEnd`) : un seul appel `runOnJS` déclenche une commande
   `sticker.update` via le CommandBus, qui crée un snapshot undo et met à jour le
   store.

Ce pattern garantit que l'undo/redo opère sur des états discrets (positions finales),
pas sur chaque micro-mouvement du doigt.
→ [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md), [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

### Catégories intégrées

Le SDK embarque un catalogue de stickers organisé en catégories :

| Catégorie | Contenu |
|---|---|
| **Emoji** | Émojis standards vectorisés |
| **Réactions** | Cœur, Feu, Applaudissements, Rire… |
| **Love** | Cœurs animés, flèches, étincelles |
| **Food** | Icônes alimentaires illustrées |
| **Travel** | Drapeaux, paysages, transports |
| **Funny** | Expressions humoristiques, mèmes illustrés |
| **Shapes** | Formes géométriques, flèches, bulles |

Des stickers additionnels sont disponibles via `StickerPack`, téléchargés et cachés
par l'[08-ASSET-MANAGER](./08-ASSET-MANAGER.md).

### Animations de sticker

Une `StickerAnimation` est appliquée au `StickerObject` indépendamment de l'animation
propre au format (ex. un sticker Lottie peut aussi avoir une animation `fadeIn`
d'entrée de scène). Les valeurs possibles sont définies dans
[02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).

## Interfaces (TS)

Les types `StickerObject` et `StickerAnimation` sont définis dans
[02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — ils ne sont pas redéfinis ici.

### Commandes sticker

```ts
// Ajoute un StickerObject sur la timeline
interface CreateStickerCommand {
  type: "sticker.create";
  payload: {
    source: string;                   // URI local ou chemin bundle SDK
    format: "png" | "svg" | "gif" | "lottie";
    startTime: number;
    endTime: number;
    x: number;
    y: number;
    scale?: number;                   // défaut : 1.0
    opacity?: number;                 // défaut : 1.0
  };
}

// Met à jour la position, les dimensions ou l'opacité d'un StickerObject
// Typiquement émis en fin de geste (onEnd Reanimated)
interface UpdateStickerCommand {
  type: "sticker.update";
  payload: {
    id: string;
    x?: number;
    y?: number;
    rotation?: number;               // degrés
    scale?: number;
    opacity?: number;
    startTime?: number;
    endTime?: number;
  };
}

// Assigne ou retire une animation d'entrée/sortie de scène
interface AnimateStickerCommand {
  type: "sticker.animate";
  payload: {
    id: string;
    animation: StickerAnimation | null;
  };
}

// Supprime un StickerObject de la timeline
interface DeleteStickerCommand {
  type: "sticker.delete";
  payload: { id: string };
}
```

### Détail du pattern gestuel (inféré)

```ts
// inféré (hors brief) — illustration du pattern Reanimated → CommandBus
function useStickerGesture(id: string, editor: Editor) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      "worklet";
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd(() => {
      // Commit atomique en JS thread — crée le snapshot undo
      runOnJS(editor.execute)("sticker.update", { id, x: x.value, y: y.value });
    });

  // Pinch (scale) et Rotation suivent le même pattern
  return { panGesture, x, y, rotation, scale };
}
```

## Configuration

Le Sticker Engine ne dépend d'aucun feature flag — il est actif dès qu'un
`StickerObject` est présent dans la track `sticker`, ou que `sticker.create` est
appelé. L'approche est **headless-first** :
[ADR-0009](./ADR/0009-headless-first-config-layers.md).

Les `StickerPack` sont déclarés dans la configuration de l'AssetManager
([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)). L'intégrateur peut restreindre les
catégories visibles dans `<StickerPicker />` via les props de ce composant
([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)).

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `sticker.enableAnimatedGifExport` | `boolean` | `true` | Active l'export GIF animé : toutes les frames du sticker GIF sont encodées dans le fichier de sortie. |
| `sticker.enable3D` | `boolean` | `true` | Active les stickers 3D au format `.glb` / ARKit. |
| `sticker.enableSimultaneousGestures` | `boolean` | `true` | Active la combinaison simultanée des gestes drag, rotation et scale via `Gesture.Simultaneous`. |
| `sticker.enableSnap` | `boolean` | `true` | Active le magnétisme (snap-to-grid et snap-to-center) pendant le drag. |
| `sticker.maxStickerPackSizeMb` | `number` | `50` | Taille maximale d'un `StickerPack` en mégaoctets (contrainte configurable, déléguée à l'AssetManager). |

```ts
// Exemple de déclaration d'un StickerPack dans la config SDK
{
  assets: {
    stickerPacks: [
      {
        id: "holiday-pack-01",
        name: "Fêtes",
        url: "https://cdn.example.com/stickers/holiday.zip",
      },
    ],
  },
}
```

## Décisions liées

- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — Skia comme surface
  de composition (PNG, SVG rasterisés).
- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — modules natifs New Arch
  pour les gestes Reanimated haute fréquence.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — commit CommandBus en fin
  de geste, snapshots undo discrets.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — Sticker Engine
  headless-first.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — rendu sticker en
  preview ≠ export (encodeur frame).

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `StickerObject`, `StickerAnimation`.
- [04-RENDERER](./04-RENDERER.md) — pipeline de composition canvas qui consomme
  les `StickerObject`.
- [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — `StickerPack`, téléchargement et cache.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — gestes Reanimated → CommandBus,
  stores Zustand.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<StickerPicker />`.
