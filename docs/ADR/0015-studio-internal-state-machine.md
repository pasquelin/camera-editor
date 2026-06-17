# ADR-0015 — Composant Studio piloté par machine à états interne (pas de routeur)

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [26-STUDIO-FLOW](../26-STUDIO-FLOW.md), [24-UI-COMPONENTS](../24-UI-COMPONENTS.md), [12-CONFIGURATION](../12-CONFIGURATION.md).

## Contexte

Le SDK doit offrir un parcours guidé capture → édition → aperçu, mais c'est **un
composant embarqué dans l'app de l'intégrateur, pas une application**. L'app hôte
possède déjà sa propre navigation (expo-router, react-navigation…). Imposer un routeur,
des URLs ou des deep-links depuis le SDK créerait un conflit de navigation et un
couplage inacceptable.

## Décision

`<MediaStudio />` est **un seul composant** dont les étapes (`capture` / `edit` /
`preview`) sont gérées par une **machine à états interne**. À un instant donné, le
composant rend **une seule sous-vue**, choisie par un `switch` sur l'état courant.
**Aucun routeur, aucune URL, aucun deep-link** n'est introduit. Les sous-vues restent
exposées et composables pour l'intégrateur avancé ; le contrôleur de flow est aussi
disponible en **headless** (`useStudioFlow`).

## Conséquences

- **Positives** : intégration triviale (un composant à monter) ; zéro conflit avec la
  navigation de l'app hôte ; testable (transitions d'état pures) ; toggle Photo/Vidéo
  et étapes entièrement **configurables** ; reste composable.
- **Négatives / coûts** : pas de back-gesture/deep-link natif fournis par le SDK (c'est
  à l'app hôte de les brancher si elle le souhaite) ; la persistance de l'étape courante
  (ex. reprise après kill) est à gérer explicitement si besoin.
- **Suivi** : exposer proprement les transitions au headless pour les intégrateurs qui
  veulent mapper leur propre navigation sur les étapes.

## Alternatives écartées

- **Routeur embarqué (expo-router interne)** : transforme le composant en mini-app,
  entre en conflit avec la navigation de l'hôte — rejeté (« composant, pas application »).
- **Un écran unique avec tous les outils** : le « méga-composant à options/events » que
  l'on veut éviter ; mauvaise UX et API surchargée.
- **Navigation déléguée entièrement à l'hôte** : possible en mode composable, mais ne
  fournit pas le parcours clé-en-main attendu par défaut.
