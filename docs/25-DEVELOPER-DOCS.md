# 25 — Developer Documentation & Distribution

> **Statut : ✅ stable.**

## Purpose

Décrire la documentation **publique** livrée avec le SDK (distincte de ce blueprint
interne), la génération d'API, l'outillage CLI et la stratégie de distribution. C'est
ce qu'un intégrateur lit pour adopter Media Studio.

## Concepts

- **Blueprint interne** (ce dossier `docs/`) : décisions d'architecture, pour le
  mainteneur. **Documentation publique** (Docusaurus) : guides d'usage, pour
  l'intégrateur. Les deux coexistent sans se dupliquer.
- **API reference auto-générée** depuis les commentaires **TSDoc** du code.
- **CLI `media-studio`** : scaffolding de plugins et de projets.

## Site de documentation (Docusaurus)

```
docs/
  getting-started/
    installation.md · quick-start.md · expo-setup.md · bare-workflow-setup.md
  core/
    architecture.md · project-schema.md · command-bus.md · event-bus.md
    object-registry.md · schema-registry.md · asset-manager.md
  runtime/
    api.md · clock.md
  guides/
    custom-plugin.md · custom-object-type.md · custom-ui.md
    resource-pack.md · migration.md
  api-reference/
    (auto-généré depuis TSDoc)
  examples/
    photo-editor-basic/ · video-editor-basic/ · custom-plugin/ · full-app/
  changelog/
    1.0.0.md
```

Chaque page publique renvoie, quand pertinent, au blueprint interne correspondant
(ex. `core/command-bus.md` → [01-ARCHITECTURE](./01-ARCHITECTURE.md) Annexe A).

## Outils

| Outil | Rôle |
|-------|------|
| **Docusaurus** | Site de documentation public. |
| **TSDoc** | Génère `api-reference/` depuis les commentaires du code. |
| **CLI `media-studio`** | Scaffolding de plugins (`create-plugin`) et de projets (`init`). |

### CLI `media-studio` (interface inférée)

```bash
# inféré (hors brief) — surface CLI plausible
media-studio init my-app            # nouveau projet intégrant le SDK
media-studio create-plugin my-fx    # squelette de plugin (id, version, onRegister)
media-studio doctor                 # vérifie config Expo / Metro / New Arch
```

## Distribution

- Publication npm `@media-studio/*` via **changesets**
  ([ADR-0014](./ADR/0014-publishing-changesets-npm.md)).
- Le package `sdk` est le point d'installation par défaut ; les packages internes
  restent installables séparément. → [11-MONOREPO](./11-MONOREPO.md).
- **Exemples d'intégration** (`examples/`) servent à la fois de doc vivante et de
  cibles de test ([14-TESTING](./14-TESTING.md)).

## Configuration

- La doc publique est versionnée avec le code ; chaque release tague une version
  Docusaurus + un `changelog/<version>.md`.
- TSDoc est la **source** de l'API reference : commenter le code = documenter l'API.
- La CLI accepte des templates personnalisés (projets/plugins) pour les équipes.

## Décisions liées

- [ADR-0014](./ADR/0014-publishing-changesets-npm.md) — publication npm via changesets.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — les guides « custom-ui » exploitent le mode headless.

## Cross-refs

- [10-ROADMAP](./10-ROADMAP.md) — Jalon 4 (distribution).
- [11-MONOREPO](./11-MONOREPO.md) — publication des packages.
- [06-PLUGIN-API](./06-PLUGIN-API.md) — guide `custom-plugin`.
