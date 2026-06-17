---
"@media-studio/background-jobs": patch
"@media-studio/ui": patch
---

Qualité : `DEFAULT_EXPORT_CONFIG` exporté par background-jobs (source unique, fin de
triplication). `<MediaStudio>` pilote l'édition via le contrôleur `createPhotoEditor`
et se rafraîchit sur les événements `stack:changed`/`timeline:changed` du Core (au
lieu de forceRender manuel + commandes en strings) ; boutons Annuler/Rétablir gérés
par canUndo/canRedo. Provider : abonnements jobs compactés, exportProject inliné.
