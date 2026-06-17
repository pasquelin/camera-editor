# ADR-0016 — Export en jobs d'arrière-plan sur snapshot

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [27-BACKGROUND-JOBS](../27-BACKGROUND-JOBS.md), [09-EXPORT-ENGINE](../09-EXPORT-ENGINE.md), [13-STATE-DATAFLOW](../13-STATE-DATAFLOW.md).

## Contexte

L'UX cible (façon TikTok) : quand l'utilisateur termine son montage, il voit un
**aperçu immédiat** et l'export final se fait **sans bloquer** ni l'interface ni la
navigation, avec un indicateur **vignette + %**. L'utilisateur doit pouvoir **continuer
à éditer/naviguer** pendant le rendu. Or l'export est un traitement long ; le faire de
façon synchrone gèlerait l'app, et le laisser lire le projet **vivant** le corromprait
si l'utilisateur édite en parallèle.

## Décision

L'export est modélisé comme un **job d'arrière-plan** géré par un `JobQueue`. À
l'`enqueue`, le job capture un **snapshot immuable** du projet et rend **cette version
figée** ; le projet vivant reste pleinement éditable. Le job expose `status`,
`progress` (0–1), une `thumbnailUri` (vignette) et émet des événements
(`job:progress`, `job:completed`…). L'aperçu immédiat est servi par la **Preview**
temps réel, indépendante du job. Le job est **annulable**.

## Conséquences

- **Positives** : UI/navigation jamais bloquées ; édition continue pendant l'export ;
  rendu déterministe (snapshot isolé des éditions concurrentes) ; plusieurs exports
  possibles ; annulation propre ; vignette + % pour le feedback.
- **Négatives / coûts** : coût mémoire/disque d'un snapshot par job ; gestion de la
  concurrence (file, limite configurable) ; cohérence à assurer si un asset référencé
  est supprimé après l'enqueue (le snapshot doit retenir les URIs nécessaires).
- **Suivi** : politique de rétention des sorties et des snapshots ; reprise/persistance
  des jobs après mise en arrière-plan prolongée ou kill de l'app.

## Alternatives écartées

- **Export synchrone bloquant** : gèle l'app pendant le rendu — incompatible avec l'UX.
- **Export sur le projet vivant (sans snapshot)** : les éditions concurrentes
  corrompent le rendu — non déterministe.
- **Verrouiller l'édition pendant l'export** : contredit l'exigence « continuer à
  naviguer/éditer pendant le traitement ».
