---
"@media-studio/renderer-preview": patch
"@media-studio/cli": patch
"@media-studio/ui": patch
"@media-studio/music-library": patch
---

Qualité : renderer-preview compose aussi les **stickers** (ImageLayer généralisé) et
mémoïse filtres + police (boucle de rendu) ; CLI ajoute la commande **`init`**
(doc 25) et factorise `writeOrLog`/`toPascalCase` ; theme extrait `RADII` partagé ;
music-library évite un double parcours dans `list`.
