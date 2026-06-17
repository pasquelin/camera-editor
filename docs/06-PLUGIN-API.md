# 06 — Plugin API

> **Statut : ✅ stable.**

## Purpose

Permettre d'étendre le SDK — types d'objets, commandes, outils, panneaux,
ResourcePacks — **sans modifier le Core**. Les plugins vivent en **dépôts séparés**,
dépendent du Core, jamais l'inverse, et s'enregistrent à chaud sur l'éditeur. C'est le
mécanisme qui rend l'architecture *ouverte* (open/closed). → [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md).

## Concepts

### Cycle de vie d'un plugin

```
editor.registerPlugin(plugin)
        │
        ▼
SecurityLayer.verifyPlugin(plugin)   ← si plugin.signature présent (plugins premium)
        │  (échec → rejet, plugin non chargé)
        ▼
plugin.onRegister(editor)            ← le plugin câble ses extensions
        │
       ... actif ...
        │
plugin.onDestroy?()                  ← nettoyage (au démontage de l'éditeur)
```

La vérification de signature est **automatique** et interne : un plugin premium non
signé ou altéré n'atteint jamais `onRegister`. → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md), [ADR-0013](./ADR/0013-security-layer-package.md).

### Premier rang : built-in = plugin

Les types built-in (video, image, text…) sont enregistrés via les **mêmes API** que
celles offertes aux plugins. Il n'y a aucune capacité réservée au Core : un plugin
peut tout ce que fait un module interne.

## Interfaces (TS)

```ts
interface MediaStudioPlugin {
  id: string;
  version: string;
  signature?: string;                  // vérifié par le Security Layer si présent

  onRegister(editor: Editor): void;
  onDestroy?(): void;
}

editor.registerPlugin(new MyPlugin());
```

### Capacités d'un plugin

Exposées sur `editor` à l'intérieur de `onRegister` :

```ts
editor.registerCommand(namespace, name, handler);   // nouvelle commande (→ CommandBus)
editor.registerObjectType(definition);               // → ObjectRegistry
editor.registerTool(tool);                            // outil d'édition
editor.registerPanel(panel);                          // panneau d'UI
editor.registerResourcePack(pack);                    // pack d'assets (→ AssetManager)
editor.on(event, handler);                            // abonnement EventBus
```

| Capacité | Cible | Détail |
|----------|-------|--------|
| `registerCommand` | CommandBus | Ajoute un verbe (`namespace.name`) annulable. → [01-ARCHITECTURE](./01-ARCHITECTURE.md) (Annexe A). |
| `registerObjectType` | ObjectRegistry | Injecte un `ObjectDefinition`. → [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md). |
| `registerTool` | UI/Runtime | Outil manipulant la sélection. |
| `registerPanel` | UI | Panneau monté dans l'UI (respecte le theming). → [24-UI-COMPONENTS](./24-UI-COMPONENTS.md). |
| `registerResourcePack` | AssetManager | Pack signé d'assets. → [08-ASSET-MANAGER](./08-ASSET-MANAGER.md). |
| `on` | EventBus | Réagit aux événements de l'éditeur. |

### Exemple — plugin enregistrant un type d'objet et une commande

```ts
class CaptionPlugin implements MediaStudioPlugin {
  id = "media-studio-ai.caption";
  version = "1.0.0";

  onRegister(editor: Editor) {
    editor.registerObjectType(CaptionObjectDefinition);     // nouveau type "caption"
    editor.registerCommand("caption", "generate", async (ctx, payload) => {
      // logique du plugin — passe par le CommandBus, donc undo/redo gratuit
    });
    editor.on("project:loaded", () => { /* … */ });
  }
}

editor.registerPlugin(new CaptionPlugin());
```

## Configuration

- L'enregistrement est **programmatique** (`registerPlugin`) ; aucun flag dédié.
- Les capacités d'un plugin peuvent être *gated* par licence (un plugin premium ne
  s'active que sous plan Pro). → [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md).
- Un plugin peut enrichir l'UI (panels/tools) tout en restant compatible avec le mode
  headless (les commandes/objets restent pilotables sans UI).

## Plugins externes de référence (dépôts séparés)

| Plugin | Apporte |
|--------|---------|
| `media-studio-ai` | Sous-titres auto, transcription, traduction, génération de contenu. |
| `media-studio-face-tracking` | Tracking visage/corps, ancrage stickers, effets AR. |
| `media-studio-collaboration` | Édition collaborative temps réel, commentaires, partage. |
| `media-studio-marketplace` | Téléchargement dynamique de ResourcePacks. |
| `media-studio-cloud-render` | Export cloud, rendu distribué, stockage distant. |

## Concepts avancés

### Sandbox d'exécution

Le SDK supporte un **mode sandbox** : un plugin peut s'exécuter dans un contexte JS
isolé du Core, en plus du mode co-contexte par défaut. Le mode co-contexte repose sur
la **signature** pour établir la confiance ; le mode sandbox ajoute une isolation
physique pour les plugins non signés ou tiers non vérifiés. Le mode est configurable
à l'enregistrement.

### Résolution de dépendances entre plugins

Le système de plugins gère la **résolution automatique des dépendances inter-plugins** :
un plugin peut déclarer ses dépendances sur d'autres plugins, et le SDK les charge dans
le bon ordre avant d'appeler `onRegister`. Les dépendances manquantes lèvent une erreur
explicite dès l'enregistrement.

### Dé-enregistrement des types built-in

Les types built-in peuvent être **dé-enregistrés ou remplacés** via l'`ObjectRegistry`.
Un plugin peut ainsi substituer entièrement un type natif par sa propre implémentation,
ce qui donne aux intégrateurs un contrôle complet sur le comportement de chaque type
d'objet, y compris les types fournis par défaut.

## Décisions liées

- [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md) — registries comme points d'extension.
- [ADR-0013](./ADR/0013-security-layer-package.md) — vérification de signature des plugins.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — extension au-delà des slots.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `ObjectDefinition` injecté par un plugin.
- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — Annexe A (commandes), Annexe B (événements).
- [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — ResourcePacks.
- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — Security Layer.
