# 25 — Developer Documentation & Distribution

> **Statut : 🟡 planifié — Passe 4 (Phase 4 roadmap).** Périmètre figé ci-dessous.

## Purpose

Plan de la documentation **publique** livrée avec le SDK (distincte de ce blueprint
interne), de la génération d'API et de l'outillage de distribution.

## Périmètre (à détailler)

### Site de documentation (Docusaurus)

```
docs/
  getting-started/   installation, quick-start, expo-setup, bare-workflow-setup
  core/              architecture, project-schema, command-bus, event-bus,
                     object-registry, schema-registry, asset-manager
  runtime/           api, clock
  guides/            custom-plugin, custom-object-type, custom-ui, resource-pack, migration
  api-reference/     (auto-généré depuis TSDoc)
  examples/          photo-editor-basic, video-editor-basic, custom-plugin, full-app
  changelog/         1.0.0.md
```

### Outils
- **Docusaurus** — site de documentation.
- **TSDoc** — génération de l'API reference depuis les commentaires.
- **CLI `media-studio`** — scaffolding de plugins et de projets.

### Distribution
- Publication npm `@media-studio/*` via changesets ([ADR-0014](./ADR/0014-publishing-changesets-npm.md)).
- Exemples d'intégration ([11-MONOREPO](./11-MONOREPO.md) → `examples/`).

## Cross-refs

- [10-ROADMAP](./10-ROADMAP.md) — Phase 4 (distribution).
- [11-MONOREPO](./11-MONOREPO.md) — publication des packages.
