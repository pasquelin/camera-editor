# 14 — Testing

> **Statut : 🟡 planifié — Passe 4.** Stratégie figée ci-dessous.

## Purpose

Définir une stratégie de test cross-packages qui couvre la logique pure, les
composants RN, les modules natifs et la fidélité d'export, exécutée via Turborepo.

## Périmètre (à détailler)

- **Core (logique pure)** : tests unitaires (Vitest/Jest) — CommandBus (execute/undo),
  registries, migrations sur projets-fixtures par version. Pas de natif requis.
- **Stores & hooks** : tests des sélecteurs et de la synchro EventBus → Zustand.
- **Composants RN** : `@testing-library/react-native` sur l'UI par défaut et les
  prop bags des slots.
- **Modules natifs** : tests d'intégration iOS/Android en CI (build natif dès Phase 2),
  EAS / GitHub Actions.
- **Parité Preview ↔ Export** : tests de référence visuelle sur filtres et texte
  (l'écart est l'invariant à surveiller — [ADR-0010](./ADR/0010-preview-export-pipeline-split.md)).
- **Export E2E** : rendu d'un projet-fixture → assertions sur durée, dimensions, codec.
- Orchestration : tâche `test` Turborepo, cache par package
  ([11-MONOREPO](./11-MONOREPO.md)).

## Cross-refs

- [11-MONOREPO](./11-MONOREPO.md) — pipeline de tâches.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — fixtures de migration.
