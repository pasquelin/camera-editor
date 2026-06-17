# 06 — Plugin API

> **Statut : 🟡 planifié — Passe 3.** Périmètre figé ci-dessous.

## Purpose

Système de plugins permettant d'étendre le SDK (types d'objets, commandes, outils,
panneaux, ResourcePacks) **sans modifier le Core**. Les plugins vivent en dépôts
séparés et dépendent du Core, jamais l'inverse.

## Périmètre (à détailler)

- Interface `MediaStudioPlugin` : `id`, `version`, `signature?`, `onRegister(editor)`,
  `onDestroy?`.
- Capacités : `registerCommand`, `registerObjectType`
  ([ObjectRegistry](./02-PROJECT-SCHEMA.md)), `registerTool`, `registerPanel`,
  `registerResourcePack`, `on(event, handler)`.
- Vérification de **signature** avant `onRegister` via le Security Layer (plugins
  premium). → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md).
- Plugins externes de référence : `media-studio-ai`, `-face-tracking`,
  `-collaboration`, `-marketplace`, `-cloud-render`.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — enregistrement de types d'objets.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — les plugins, niveau d'extension au-delà des slots.
- [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md) — registries comme points d'extension.
