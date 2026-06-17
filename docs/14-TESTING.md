# 14 — Testing

> **Statut : ✅ stable.**

## Purpose

Définir une stratégie de test **cross-packages** qui couvre la logique pure, les
stores, les composants RN, les modules natifs et la fidélité d'export, orchestrée par
Turborepo ([11-MONOREPO](./11-MONOREPO.md)). Objectif : pouvoir refactorer un package
sans casser les autres, et garantir la parité preview ↔ export.

## Concepts — la pyramide de test

```
        ▲  Export E2E (rendu réel d'un projet-fixture)
       ╱ ╲ Parité Preview ↔ Export (référence visuelle)
      ╱   ╲ Intégration native (CI iOS + Android)
     ╱     ╲ Composants RN (testing-library)
    ╱       ╲ Stores & hooks (sélecteurs, synchro EventBus)
   ╱_________╲ Unitaire Core (pur JS, sans natif)
```

Plus on descend, plus c'est rapide et nombreux ; plus on monte, plus c'est lent et
ciblé.

## Stratégie par couche

### Core (logique pure)
Tests unitaires (Vitest/Jest), **sans natif** :
- **CommandBus** : chaque commande `execute()` puis `undo()` restaure l'état exact.
- **Registries** : enregistrement/résolution des types.
- **SchemaRegistry** : migrations enchaînées sur **projets-fixtures par version**
  ([02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md)).

### Stores & hooks
- Sélecteurs atomiques (pas de re-render hors scope).
- Synchro `EventBus → Zustand` ([13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md)).
- Hooks headless (`useEditor`, `useRuntime`, `useTimeline`) testés sans UI.

### Composants RN
`@testing-library/react-native` sur l'UI par défaut et les **prop bags** des slots
([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)) : un slot reçoit bien l'état et les actions.

### Intégration native (CI)
- Build natif iOS + Android en CI (EAS / GitHub Actions) dès le Jalon 2.
- Caméra, lecture vidéo, encode/decode, effets GPU vérifiés sur simulateur/émulateur
  et device réel pour les chemins critiques. → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md).

### Parité Preview ↔ Export
Suite de **référence visuelle** : un même projet rendu en preview et à l'export doit
produire des images dans une tolérance bornée (filtres, texte, transitions). C'est
l'invariant des deux pipelines. → [04-RENDERER](./04-RENDERER.md),
[ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

### Export E2E
Rendu d'un projet-fixture → assertions sur durée, dimensions, codec, présence audio,
et hash perceptuel de frames clés. Couvre FFmpeg **et** fallback natif
([ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md)).

## Configuration

- Orchestration via la tâche `test` Turborepo, **cache par package** (un package non
  modifié n'est pas re-testé). → [11-MONOREPO](./11-MONOREPO.md).
- Seuils de parité et tolérances configurables par catégorie (filtres vs texte).
- Fixtures de projet versionnées pour valider chaque migration publiée.
- Tests de gating de licence : une capacité Pro demandée sans droit retombe en
  fallback (et n'échoue pas). → [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md).

## Décisions liées

- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — testabilité des commandes (execute/undo).
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — parité preview/export.
- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — E2E sur deux backends.

## Cross-refs

- [11-MONOREPO](./11-MONOREPO.md) — pipeline de tâches Turborepo.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — fixtures de migration.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — tests stores/hooks.
