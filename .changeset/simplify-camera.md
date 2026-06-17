---
"@media-studio/camera": patch
---

Qualité : compteur d'ids isolé par session (closure, plus de `seq` module-level) ;
`CameraRatio` aliasé sur `AspectRatio` du core (plus de doublon) ; `addClip`
positionne les segments à la suite de la piste vidéo réelle du projet (vérité du
projet, plus de compteur interne) ; corps commun de capture factorisé (`addCapture`).
