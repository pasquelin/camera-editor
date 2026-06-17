# ADR-0004 — Clock partagée en SharedValue Reanimated

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [03-RUNTIME](../03-RUNTIME.md), [05-TIMELINE](../05-TIMELINE.md), [13-STATE-DATAFLOW](../13-STATE-DATAFLOW.md).

## Contexte

La lecture (play) doit faire avancer un temps courant jusqu'à 60×/s et le distribuer
à plusieurs consommateurs (Timeline, Preview, Audio) **en parfaite synchronisation**
et sans saccade. Propager ce temps via l'état React provoquerait un re-render par
frame et tuerait la fluidité.

## Décision

La clock du Runtime est une **`SharedValue<number>` Reanimated** (ms), avancée sur
l'**UI thread** via `useFrameCallback`. Les consommateurs la lisent en lecture seule
par `useAnimatedReaction` (worklets), sans repasser par le thread JS. Le `runtimeStore`
Zustand n'expose que l'état discret (`isPlaying`, `playbackRate`), **jamais**
`currentTime`.

## Conséquences

- **Positives** : 60 fps sans re-render React ; synchro native entre Timeline et
  Preview ; cohérent avec les gestes (déjà en Reanimated).
- **Négatives / coûts** : la frontière worklet/JS impose `runOnJS` pour tout commit
  vers le Core ; lire le temps en JS est ponctuel (`getCurrentTime()`), pas réactif.
- **Suivi** : valider la dérive temporelle sur longues lectures et la synchro audio.

## Alternatives écartées

- **`useState`/Zustand pour le temps** : re-render par frame, inacceptable.
- **`setInterval` JS** : imprécis, jitter, bloqué par le travail JS.
- **Horloge native poussée par event** : pont natif→JS trop fréquent, latence.
