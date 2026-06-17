# ADR-0007 — Mutations via CommandBus + undo/redo

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [01-ARCHITECTURE](../01-ARCHITECTURE.md), [02-PROJECT-SCHEMA](../02-PROJECT-SCHEMA.md), [13-STATE-DATAFLOW](../13-STATE-DATAFLOW.md).

## Contexte

L'éditeur doit offrir un undo/redo fiable sur des dizaines d'opérations
hétérogènes (créer/éditer/trim/split/merge/supprimer), tout en gardant une source de
vérité cohérente et un flux de données traçable. Laisser chaque module muter le
projet directement rendrait l'undo et le débogage impossibles.

## Décision

**Toute** mutation du projet passe par un **CommandBus**. Chaque commande implémente
`execute(context)` et `undo(context)`. Le bus tient un `undoStack` (taille configurable, **50 par défaut** via `config.limits.undoStackSize` (`EditorLimits`)) et un `redoStack`. Les opérations destructives (split, merge, reverse)
prennent un **snapshot** du `ProjectManager` avant exécution. Les opérations de
preview (seek, zoom) ne sont **pas** enregistrées.

## Conséquences

- **Positives** : undo/redo uniforme ; un seul point d'entrée pour muter → flux
  unidirectionnel et événements cohérents ; les plugins ajoutent des commandes sans
  toucher au Core ; testabilité (rejouer/inverser une commande).
- **Négatives / coûts** : tout passe par une indirection (un peu de boilerplate par
  commande) ; les snapshots ont un coût mémoire borné par l'undo stack ; discipline
  requise (aucune mutation hors bus, vérifiée en review).
- **Suivi** : surveiller le coût des snapshots sur gros projets ; envisager des
  commandes inversibles sans snapshot quand c'est possible.

## Alternatives écartées

- **Mutation directe + diff** : reconstruire l'undo par diff d'état est fragile et
  coûteux, et perd l'intention de l'opération.
- **Immer + patches** : élégant pour l'état JS, mais ne couvre pas les effets de
  bord natifs/assets et mélangerait la vérité avec le mécanisme d'undo.
- **Event sourcing complet** : trop lourd pour un éditeur mobile mono-projet en V1.
