# ADR-0008 — Extensibilité par ObjectRegistry + SchemaRegistry

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [02-PROJECT-SCHEMA](../02-PROJECT-SCHEMA.md), [06-PLUGIN-API](../06-PLUGIN-API.md), [01-ARCHITECTURE](../01-ARCHITECTURE.md).

## Contexte

Le Core doit rester **stable et fermé** mais le SDK doit accueillir de nouveaux
types d'objets (face-anchor, caption, …) via des plugins en dépôts séparés, sans
modification du Core, et sans casser les projets existants quand un schéma évolue.

## Décision

Deux registres sont les **uniques points d'extension** du modèle de données :

- **`ObjectRegistry`** : enregistre les types d'objets (`ObjectDefinition` =
  `schema` + `defaultValues` + `validate` + `migrate`). Les built-in (video, image,
  text, audio, sticker, filter) y sont enregistrés au démarrage, exactement comme un
  plugin enregistrerait un type custom.
- **`SchemaRegistry`** : enregistre les migrations `from → to` appliquées en chaîne à
  l'import. **Toute** modification d'une interface `EditorObject` existante
  s'accompagne d'une migration enregistrée.

Principe **open/closed** : on étend par enregistrement, on ne modifie pas le Core.

## Conséquences

- **Positives** : Core inchangé quand l'écosystème grossit ; plugins de premier
  rang (aucune différence built-in/plugin) ; compatibilité ascendante garantie par
  les migrations ; validation centralisée à l'import.
- **Négatives / coûts** : discipline de migration obligatoire (un changement de type
  sans migration = projet cassé) ; un registre à initialiser tôt dans le cycle de vie.
- **Suivi** : tests de migration sur projets-fixtures de chaque version publiée.

## Alternatives écartées

- **Types codés en dur dans le Core** : impose de modifier le Core pour chaque
  extension — contraire à la vision plugins.
- **Schéma libre non validé** : ouvre la porte aux projets corrompus et aux
  régressions silencieuses.
- **Migrations ad hoc hors registre** : impossible d'enchaîner proprement les
  versions et de raisonner sur le chemin de migration.
