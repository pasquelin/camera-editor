# ADR-0017 — Provider racine + présentation par portail (UX non-bloquante globale)

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [26-STUDIO-FLOW](../26-STUDIO-FLOW.md), [27-BACKGROUND-JOBS](../27-BACKGROUND-JOBS.md), [24-UI-COMPONENTS](../24-UI-COMPONENTS.md), [13-STATE-DATAFLOW](../13-STATE-DATAFLOW.md).

## Contexte

L'UX cible (façon TikTok) : pouvoir **ouvrir l'éditeur de n'importe quel écran**, et
surtout **ne jamais bloquer l'utilisateur** pendant un traitement — il valide son
montage, l'éditeur se ferme, il continue à naviguer, et la **progression de l'export
reste visible partout**. Si l'état du traitement (jobs, progression) vivait dans
l'écran d'édition, il serait détruit au démontage de cet écran et la progression
disparaîtrait à la navigation. Par ailleurs, le SDK est **un composant, pas une app**
([ADR-0015](./0015-studio-internal-state-machine.md)) : il ne doit pas imposer de
routeur.

## Décision

Un **`MediaStudioProvider` monté une fois à la racine** de l'app détient l'**état
global** : `JobQueue`, progression agrégée, drafts. Il expose une **API impérative**
`useMediaStudio()` (`open()`, `close()`, `jobs`, `activeProgress`). L'éditeur est
**présenté en overlay plein écran via un portail**, **au-dessus** de la navigation de
l'app hôte (qui reste intacte) — **pas de routeur, pas d'URL**. La vignette de
progression (`<ExportProgress />`) est rendue par le Provider, donc **visible sur tous
les écrans**. Les jobs survivent à la fermeture de l'éditeur et au passage en
arrière-plan (tâche native de fond, persistance).

Le **montage direct** `<MediaStudio />` dans un seul écran reste supporté pour les cas
simples ; le Provider est le mode recommandé pour une création accessible app-wide et
non-bloquante.

## Conséquences

- **Positives** : l'utilisateur n'est **jamais bloqué** par un traitement ; ouverture
  de l'éditeur depuis n'importe où (bouton ou au load d'un écran) ; progression
  globale persistante ; navigation de l'app intacte (overlay, pas de routeur) ; jobs et
  drafts survivent à la navigation et au backgrounding.
- **Négatives / coûts** : un Provider doit envelopper l'app (étape d'installation) ;
  la présentation par portail doit gérer l'empilement (clavier, safe areas, gestes) ;
  la persistance des jobs/draft ajoute de la gestion d'état au démarrage.
- **Suivi** : politique de rétention des drafts/sorties ; comportement si plusieurs
  `open()` concurrents ; intégration avec les notifications de progression natives.

## Alternatives écartées

- **État du traitement dans l'écran d'édition** : détruit à la navigation, la
  progression disparaît — incompatible avec l'UX non-bloquante.
- **Routeur embarqué / écran poussé par le SDK** : transforme le composant en app et
  entre en conflit avec la navigation de l'hôte ([ADR-0015](./0015-studio-internal-state-machine.md)).
- **Monter l'éditeur sur chaque écran** : lourd et inutile ; seul l'**état global** +
  la **vignette** doivent être globaux, pas l'éditeur lui-même.
