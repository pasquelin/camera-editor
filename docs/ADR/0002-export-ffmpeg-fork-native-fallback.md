# ADR-0002 — Export : fork FFmpeg + fallback natif par plateforme

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [09-EXPORT-ENGINE](../09-EXPORT-ENGINE.md), [04-RENDERER](../04-RENDERER.md), [00-VISION](../00-VISION.md).

## Contexte

`ffmpeg-kit-react-native` — la dépendance de référence pour l'encodage vidéo en RN —
est **abandonnée depuis fin 2023** (retraits des binaires, plus de maintenance). Le
SDK doit produire des MP4/MOV de qualité sur iOS et Android pendant des années, sans
dépendre d'un projet mort, et en restant installable proprement.

## Décision

Pipeline d'export **à deux étages** :

1. **FFmpeg via un fork communautaire actif** comme moteur principal d'export
   (composition, filtres, mux), choisi pour sa maintenance et sa licence.
2. **Fallback natif par plateforme** : **AVFoundation** (iOS) et **MediaCodec**
   (Android) pour les cas où FFmpeg n'est pas disponible/souhaitable (taille du
   binaire, codec matériel, perf). Le choix moteur est encapsulé derrière
   l'interface `ExportRenderer`, transparent pour l'appelant.

## Conséquences

- **Positives** : pas de dépendance à un paquet abandonné ; chemin natif performant
  et léger ; flexibilité de basculer de moteur sans changer l'API publique.
- **Négatives / coûts** : deux backends à maintenir et à tester ; taille de binaire
  accrue si FFmpeg est embarqué ; surface de tests d'export plus large (par
  plateforme et par moteur).
- **Suivi** : réévaluer le fork retenu annuellement ; surveiller l'évolution des
  codecs matériels (H.265 pour le plan Pro).

## Alternatives écartées

- **Rester sur `ffmpeg-kit-react-native`** : abandonné, binaires retirés — exclu.
- **Tout natif, sans FFmpeg** : limite la portabilité des filtres complexes et
  duplique beaucoup de logique de composition entre iOS et Android.
- **Export cloud** : reporté à un plugin (`media-studio-cloud-render`), hors V1.
