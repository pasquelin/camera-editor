# 21 — Filter Engine

> **Statut : ✅ stable.**

## Purpose

Moteur de filtres et d'effets colorimétriques. Le Filter Engine applique des
transformations visuelles aux médias (photo et vidéo) via deux pipelines complémentaires :
`ColorFilter` / `ImageFilter` Skia pour la photo, et shaders GLSL (Metal / OpenGL ES)
pour les effets GPU temps-réel sur la vidéo. Il expose un catalogue intégré de 18
filtres organisés en 5 catégories, extensible via `FilterPack` et `config.filters`.
Toutes les mutations passent par le CommandBus. La **parité preview/export** est une
exigence structurelle — [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

## Concepts

### Deux pipelines de rendu

Le choix du pipeline dépend du type de média cible :

| Pipeline | Média | Technologie | Thread |
|---|---|---|---|
| **Skia ColorFilter / ImageFilter** | Photo (`ImageObject`) | `@shopify/react-native-skia` | UI thread (worklet) |
| **Shader GLSL** | Vidéo (`VideoObject`) | Metal (iOS) / OpenGL ES (Android) via module natif | GPU thread |

En mode photo, le filtre est composé directement dans le canvas Skia sans frame
intermédiaire. En mode vidéo, le shader est appliqué frame-par-frame pendant la
lecture preview et rejoué à l'identique lors de l'export, garantissant la parité
— [04-RENDERER](./04-RENDERER.md).

### Catalogue intégré

#### Vintage

| ID | Nom | Effet principal |
|---|---|---|
| `vintage-sepia` | Sepia | Désaturation + teinte sépia chaude |
| `vintage-retro` | Retro | Contraste réduit, vignette légère |
| `vintage-old-film` | Old Film | Grain, rayures, virages jaunis |
| `vintage-dust` | Dust | Particules et taches de poussière |

#### Cinema

| ID | Nom | Effet principal |
|---|---|---|
| `cinema-drama` | Drama | Contraste élevé, liftées ombres bleutées |
| `cinema-hollywood` | Hollywood | Orange midtones, ciel teal |
| `cinema-teal-orange` | Teal & Orange | Split-tone teal/orange (look blockbuster) |

#### Beauty

| ID | Nom | Effet principal |
|---|---|---|
| `beauty-glow` | Glow | Bloom lumineux sur les hautes lumières |
| `beauty-smooth` | Smooth | Flou léger, peau adoucie |
| `beauty-bright` | Bright | Exposition + saturation accentuées |

#### Black & White

| ID | Nom | Effet principal |
|---|---|---|
| `bw-classic` | Classic | Désaturation neutre |
| `bw-contrast` | Contrast | Contraste fort, noirs profonds |
| `bw-film-noir` | Film Noir | Vignette marquée, grain, ombres dures |

#### Social

| ID | Nom | Effet principal |
|---|---|---|
| `social-tiktok` | TikTok | Saturation vibrante, look vertical trend |
| `social-reels` | Reels | Contraste pop, légère teinte violacée |
| `social-neon` | Neon | Couleurs fluorescentes, fond sombre |
| `social-dream` | Dream | Teintes pastel, flou doux, grain fin |

### Paramètres et intensité

Les paramètres fins d'un filtre sont décrits par `FilterParams`, défini dans
[02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md). Le champ `intensity` (0–1) pilote
l'interpolation linéaire entre l'image originale et l'effet à pleine puissance ;
les autres champs (`contrast`, `saturation`, `brightness`, `temperature`) permettent
un réglage additionnel par-dessus le filtre.

`FilterObject.params` est un `Record<string, number>` libre qui accueille les
paramètres built-in sous la forme `FilterParams` ainsi que des paramètres custom
exposés par un `FilterPack` ou un plugin.

### Extensibilité

- **FilterPack** : collection de filtres (LUTs, shaders) téléchargée et cachée via
  [08-ASSET-MANAGER](./08-ASSET-MANAGER.md).
- **`config.filters`** : catalogue custom déclaré dans la configuration SDK
  ([12-CONFIGURATION](./12-CONFIGURATION.md)), permettant à l'intégrateur d'ajouter
  ou de masquer des filtres sans modifier le Core.
- **ADR-0009** : le Filter Engine est headless-first — l'intégrateur peut piloter
  les filtres via les commandes sans monter `<FilterPicker />`.

## Interfaces (TS)

Les types `FilterObject` et `FilterParams` sont définis dans
[02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — ils ne sont pas redéfinis ici.

### Commandes filter

```ts
// Applique un filtre à un objet média existant (photo ou vidéo)
interface CreateFilterCommand {
  type: "filter:create";
  payload: {
    targetId: string;         // id du VideoObject ou ImageObject cible
    filterId: string;         // clé du catalogue (ex. "cinema-drama")
    intensity?: number;       // 0–1 ; défaut : 1.0
    params?: Partial<FilterParams>;
  };
}

// Met à jour l'intensité ou les paramètres d'un FilterObject existant
interface UpdateFilterCommand {
  type: "filter:update";
  payload: {
    id: string;               // id du FilterObject
    intensity?: number;
    params?: Partial<FilterParams>;
  };
}

// Retire le filtre (supprime le FilterObject de la track filter)
interface DeleteFilterCommand {
  type: "filter:delete";
  payload: { id: string };
}
```

### FilterDefinition (inférée)

```ts
// inféré (hors brief) — descripteur interne d'un filtre dans le registre du moteur
interface FilterDefinition {
  /** Identifiant unique dans le catalogue (ex. "vintage-sepia"). */
  id: string;

  /** Nom affiché dans l'UI (ex. "Sepia"). */
  name: string;

  /** Catégorie d'appartenance (ex. "Vintage"). */
  category: "Vintage" | "Cinema" | "Beauty" | "Black & White" | "Social" | string;

  /**
   * Fonction d'application pour le pipeline Skia (photo).
   * Reçoit un paint Skia et les paramètres résolus ; retourne le paint modifié.
   */
  applySkia: (paint: SkPaint, params: FilterParams) => SkPaint;

  /**
   * Descripteur shader pour le pipeline GPU (vidéo).
   * Contient le source GLSL et la liste des uniforms nécessaires.
   * null si le filtre ne supporte pas le mode vidéo GPU.
   */
  shaderDescriptor: {
    glsl: string;             // source GLSL (Metal / GLSL ES)
    uniforms: string[];       // noms des uniforms injectés (intensity, contrast…)
  } | null;
}
```

### Exemple d'usage headless

```ts
const editor = new Editor();
await editor.loadProject(project);

// Applique le filtre Drama à une vidéo existante, à 70% d'intensité
editor.commandBus.dispatch({
  type: "filter:create",
  payload: {
    targetId: "video-clip-01",
    filterId: "cinema-drama",
    intensity: 0.7,
    params: { contrast: 0.2, temperature: -0.1 },
  },
});

// Réduit l'intensité en temps réel (ex. slider UI)
editor.commandBus.dispatch({
  type: "filter:update",
  payload: { id: "filter-01", intensity: 0.4 },
});
```

## Configuration

```ts
// Extrait de la config SDK — filtres et packs
{
  filters: {
    // Masque des filtres du catalogue intégré
    hidden: ["social-tiktok", "social-reels"],

    // Filtres custom de l'intégrateur (définis via FilterDefinition)
    custom: [
      {
        id: "brand-sunset",
        name: "Sunset Brand",
        category: "Social",
        applySkia: (paint, params) => { /* … */ return paint; },
        shaderDescriptor: null,
      },
    ],
  },

  assets: {
    filterPacks: [
      {
        id: "cinema-lut-pack",
        name: "Cinema LUTs",
        url: "https://cdn.example.com/filters/cinema-luts.zip",
      },
    ],
  },
}
```

Le Filter Engine est activé dès qu'un `FilterObject` est présent dans la track
`filter`, ou que `filter:create` est dispatché. Il n'est pas conditionné par un
feature flag global en V1 — [ADR-0009](./ADR/0009-headless-first-config-layers.md).

## Capacités avancées

- **Multi-pass GPU** : plusieurs `FilterObject` peuvent être chaînés sur un même
  `VideoObject`, permettant des effets combinés (ex. Smooth + Glow). Le CommandBus
  orchestre l'ordre d'application.
- Les shaders GLSL sont compilés au démarrage du module natif. Les FilterPacks
  distants peuvent enregistrer de nouveaux shaders, chargés dynamiquement par le
  module natif.
- Les filtres animés dans le temps via keyframes d'intensité sont supportés.
- Les LUTs 3D (cube files `.cube`) sont prises en charge, distribuables via FilterPack
  ou embarquées dans le catalogue intégré.
- En mode photo, la composition séquentielle de plusieurs filtres via le pipeline Skia
  (chaînage de `SkPaint`) est supportée sans limite de filtres empilés.

## Décisions liées

- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — pipeline d'export
  vidéo dans lequel les shaders filtres sont rejoués.
- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — Skia comme surface
  de rendu photo ; modules natifs GPU pour la vidéo.
- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — module natif New Arch
  pour l'accès GPU (Metal / OpenGL ES).
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — Filter Engine
  headless-first, catalogue extensible via config.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — parité obligatoire
  preview vs export pour les filtres.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `FilterObject`, `FilterParams`.
- [04-RENDERER](./04-RENDERER.md) — consommation des `FilterObject` en preview
  (Skia + shader GPU).
- [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — `FilterPack`, LUTs distantes, cache.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — `config.filters`, filtres custom,
  masquage catalogue.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — CommandBus, stores Zustand,
  undo/redo filtres.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<FilterPicker />`.
