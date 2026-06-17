# ADR-0009 — Headless-first + couches de configuration

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [12-CONFIGURATION](../12-CONFIGURATION.md), [00-VISION](../00-VISION.md), package `ui`.

## Contexte

L'exigence produit est que **tout soit paramétrable** : un intégrateur doit pouvoir
utiliser le SDK clé en main, ou le réhabiller entièrement, ou le piloter sans aucune
UI fournie. Si l'UI par défaut détient de la logique métier, ces deux derniers cas
deviennent impossibles ou demandent du copier-coller.

## Décision

Architecture **headless-first** à quatre niveaux d'override (cf.
[12-CONFIGURATION](../12-CONFIGURATION.md)) :

0. **Capability flags** — activer/désactiver des sous-systèmes.
1. **Design tokens** — thémer l'UI par défaut (couleurs, fonts, radius, spacing).
2. **Slots / render-props** — remplacer un composant précis, qui reçoit un prop bag typé.
3. **Headless** — consommer directement les controllers/hooks, zéro UI.

**Invariant** : l'UI par défaut (package `ui`) est construite **exclusivement** au-
dessus des mêmes hooks publics que ceux du mode headless. Aucune capacité n'existe
qui ne soit accessible sans l'UI.

## Conséquences

- **Positives** : « tout paramétrable » devient structurel et vérifiable, pas un
  slogan ; on peut tester la logique sans monter d'UI ; les intégrateurs choisissent
  leur niveau d'engagement ; l'UI reste mince et remplaçable.
- **Négatives / coûts** : chaque composant doit exposer un prop bag stable
  (contrat public à maintenir) ; discipline pour ne jamais glisser de logique dans
  l'UI ; surface d'API publique plus grande (les hooks headless sont du contrat).
- **Suivi** : revue systématique « cette logique pourrait-elle vivre dans un
  controller plutôt que dans le composant ? ».

## Alternatives écartées

- **UI couplée + props de personnalisation** : plafonne vite ; impossible de tout
  réhabiller sans forker.
- **Theming seul** : ne permet pas de remplacer un écran ni le mode headless.
- **Deux bases de code (UI vs headless)** : divergence garantie et double
  maintenance pour un dev solo.
