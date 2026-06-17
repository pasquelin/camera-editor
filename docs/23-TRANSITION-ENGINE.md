# 23 — Transition Engine

> **Statut : ✅ stable.**

## Purpose

Appliquer des transitions visuelles entre deux clips vidéo contigus sur la même
`VideoTrack`. Le Transition Engine ne contient aucune logique de composition : il
décrit **quelle** transition relier à **quelle** jointure de clips ; c'est le
Renderer ([04-RENDERER](./04-RENDERER.md)) qui l'exécute en preview et l'Export
Engine ([09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md)) qui l'applique en qualité maximale.

## Concepts

### Jointure entre deux clips

Une transition s'attache toujours à la **jointure** entre un clip A (celui qui se
termine) et un clip B (celui qui commence), sur la même `VideoTrack`. Elle n'existe
pas de façon autonome : supprimer l'un des deux clips supprime automatiquement la
transition associée.

```
VideoTrack
 ┌──────────────────┬─────────────────────┐
 │     Clip A       │ ←— transition —→ │ Clip B │
 └──────────────────┴─────────────────────┘
                    ▲
              jointure (clipA.id, clipB.id)
              durée : durationMs (ms)
              chevauchement symétrique
```

La durée `durationMs` est soustraite symétriquement à la région de sortie de A et à
la région d'entrée de B : chaque clip « prête » la moitié de la durée à l'overlap.
Les clips doivent donc avoir une durée trimée supérieure à `durationMs / 2`.

### Transitions disponibles en V1

| Identifiant | Description |
|-------------|-------------|
| `cut` | Coupe franche, sans interpolation (durée = 0 ms). |
| `fade` | Fondu enchaîné (dissolve blanc ou noir selon `color`). |
| `zoom` | Zoom progressif entre A et B. |
| `slide-up` | Clip B entre par le bas, clip A sort par le haut. |
| `slide-down` | Clip B entre par le haut, clip A sort par le bas. |
| `slide-left` | Clip B entre par la droite, clip A sort par la gauche. |
| `slide-right` | Clip B entre par la gauche, clip A sort par la droite. |
| `blur` | Les deux clips se flouent progressivement pendant la transition. |
| `dissolve` | Fondu croisé progressif (opacités croisées). |

Les transitions `cut` ignorent `durationMs` (la jointure est instantanée).

### TransitionPack — transitions additionnelles

Des transitions supplémentaires peuvent être distribuées sous forme de
`TransitionPack` via l'Asset Manager ([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)).
Un pack enregistre ses transitions dans le registre interne ; elles deviennent
accessibles avec les mêmes interfaces que les transitions intégrées.

### Rendu dans les deux pipelines

La transition est rendue différemment selon le contexte :

| Pipeline | Comportement |
|----------|-------------|
| **Preview** ([04-RENDERER](./04-RENDERER.md)) | Effet simplifié (approximation temps réel, priorité fluidité). |
| **Export** ([09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md)) | Effet qualité maximale, rendu frame-à-frame. |

Ce comportement découle du split preview / export ([ADR-0010](./ADR/0010-preview-export-pipeline-split.md)) :
le Renderer preview peut sacrifier la fidélité pour tenir 30 fps ; l'export n'a pas
cette contrainte.

### Mutations via le CommandBus

Toutes les opérations sur les transitions passent par le CommandBus
([ADR-0007](./ADR/0007-mutations-commandbus-undo.md)) et sont annulables :

| Commande | Effet |
|----------|-------|
| `transition.set` | Attache (ou remplace) une transition à une jointure. |
| `transition.update` | Modifie la durée ou les options d'une transition existante. |
| `transition.remove` | Supprime la transition ; la jointure redevient un `cut`. |

## Interfaces (TS)

```ts
// Type principal d'une transition attachée à une jointure (inféré — hors brief)
interface Transition {
  type:
    | "cut"
    | "fade"
    | "zoom"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "blur"
    | "dissolve"
    | string;        // identifiant d'un TransitionPack
  durationMs: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out"; // inféré — hors brief
}

// Jointure entre deux clips sur la même VideoTrack (inféré — hors brief)
interface ClipJunction {
  trackId: string;
  clipAId: string;   // clip sortant
  clipBId: string;   // clip entrant
  transition: Transition;
}

// Commandes passées au CommandBus
interface TransitionSetCommand {
  command: "transition.set";
  payload: {
    trackId: string;
    clipAId: string;
    clipBId: string;
    transition: Transition;
  };
}

interface TransitionUpdateCommand {
  command: "transition.update";
  payload: {
    trackId: string;
    clipAId: string;
    clipBId: string;
    patch: Partial<Omit<Transition, "type">>;
  };
}

interface TransitionRemoveCommand {
  command: "transition.remove";
  payload: {
    trackId: string;
    clipAId: string;
    clipBId: string;
  };
}
```

### Exemple d'usage

```ts
// Ajouter un fondu de 500 ms entre deux clips
editor.execute("transition.set", {
  trackId: "track-1",
  clipAId: "clip-a",
  clipBId: "clip-b",
  transition: { type: "fade", durationMs: 500, easing: "ease-in-out" },
});

// Modifier uniquement la durée
editor.execute("transition.update", {
  trackId: "track-1",
  clipAId: "clip-a",
  clipBId: "clip-b",
  patch: { durationMs: 300 },
});

// Supprimer → retour à un cut
editor.execute("transition.remove", {
  trackId: "track-1",
  clipAId: "clip-a",
  clipBId: "clip-b",
});
```

## Configuration

```ts
// Extrait de MediaStudioConfig (12-CONFIGURATION)
interface MediaStudioConfig {
  capabilities?: {
    enableTransitions?: boolean;   // false → aucune transition rendue
  };
}
```

- Le flag `enableTransitions: false` (niveau 0) désactive le sous-système : les
  jointures sont toutes traitées comme des `cut` sans charger le moteur de transition.
- Les `TransitionPack` sont enregistrés via l'Asset Manager ; aucune configuration
  supplémentaire n'est requise côté `MediaStudioConfig`.
- Le mode headless expose `useTransitions(editor)` pour lire et piloter les
  transitions depuis une UI personnalisée.

## Capacités avancées

- Les transitions s'appliquent entre deux clips contigus sur la même `VideoTrack` ; les
  transitions cross-track sont également supportées.
- La durée `durationMs` est contrainte par l'overlap symétrique : elle ne peut pas
  dépasser la moitié de la durée trimée du clip le plus court impliqué.
- La preview utilise un rendu optimisé temps réel ; l'export produit la fidélité maximale
  frame-à-frame — les deux restent cohérents visuellement.
- Les courbes d'easing personnalisées sont supportées en complément des quatre valeurs
  CSS standards (`linear`, `ease-in`, `ease-out`, `ease-in-out`).
- `TransitionPack` : le rendu qualité-max des packs tiers est disponible tant en preview
  qu'en export.

## Décisions liées

- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — choix de Skia pour la composition de frames, base du rendu de transitions.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — mutations via CommandBus, undo/redo.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — split preview (simplifié) / export (qualité max).

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — stockage des `ClipJunction` dans le schéma de projet.
- [04-RENDERER](./04-RENDERER.md) — exécution des transitions en preview.
- [05-TIMELINE](./05-TIMELINE.md) — clips contigus, points de jointure, overlap.
- [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — distribution et résolution des `TransitionPack`.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — rendu qualité maximale des transitions à l'export.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — flag `enableTransitions`.
