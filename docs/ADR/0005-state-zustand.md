# ADR-0005 — État UI/éditeur avec Zustand

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [13-STATE-DATAFLOW](../13-STATE-DATAFLOW.md), package `ui`.

## Contexte

L'UI a besoin d'un état dérivé/éphémère réactif (sélection, outil actif, panneaux,
zoom, miroir indexé du projet) avec un contrôle fin des re-renders. La source de
vérité reste le `ProjectManager` du Core ; il faut une couche réactive légère qui
**reflète** sans **posséder**.

## Décision

On utilise **Zustand** pour les stores réactifs de l'UI/éditeur, découpés en quatre
stores à frontières nettes (`project`, `editor`, `runtime`, `ui` — cf.
[13-STATE-DATAFLOW](../13-STATE-DATAFLOW.md)). Les stores se synchronisent depuis le
Core via l'`EventBus`. Sélecteurs atomiques + indexation par id pour des re-renders
ciblés.

## Conséquences

- **Positives** : API minimale, sans boilerplate ni Context Provider ;
  sélecteurs performants ; hors-React possible (utile pour le mode headless) ;
  taille de bundle réduite.
- **Négatives / coûts** : la discipline « le projet n'est jamais la vérité dans
  Zustand » doit être tenue ; risque de stores qui dérivent si on y met trop.
- **Suivi** : garder les stores fins ; auditer les sélecteurs sur listes longues.

## Alternatives écartées

- **Redux Toolkit** : trop de boilerplate pour un dev solo, bénéfice marginal ici.
- **React Context** : re-render en cascade, inadapté à un éditeur haute fréquence.
- **Jotai/Recoil** : atomes intéressants mais Zustand colle mieux au besoin
  « store-as-mirror » et au pilotage hors-React.
