---
"@media-studio/video-editor": minor
"@media-studio/photo-editor": minor
"@media-studio/sdk": minor
---

Contrôleurs d'édition headless : `@media-studio/video-editor` (`createVideoEditor` —
create/update/remove/trim/split/merge/reverse/setSpeed/mute/setCover + undo/redo) et
`@media-studio/photo-editor` (`createPhotoEditor` — addImage/update/remove/crop/rotate/
flipHorizontal/flipVertical + overlays text/sticker/filter + undo/redo ; dessin/resize/
export différés car couplés au renderer). Le `sdk` ré-exporte désormais aussi
transition-engine, audio-engine, video-editor et photo-editor. Conforme à docs/17,18.
