---
"@media-studio/core": minor
---

Types et commandes built-in du Core (Jalon 0). Enregistrement des 6
`ObjectDefinition` built-in (video, image, text, audio, sticker, filter) avec
`defaultValues` + `validate` (zéro dépendance), et des handlers de commandes du
catalogue (create/update/delete + verbes spécifiques : video.trim/split/merge/
reverse/speed/mute/cover, image.crop, text.style/animate, sticker.animate,
audio.trim/volume/fade). Undo par snapshot uniforme. Auto-enregistrement au
démarrage du Core (`CoreDependencies.builtins`, défaut `true`) via la même API
publique que les plugins (`registerObjectType` ajouté à la façade). La piste
visuelle (`tracks.video`) accueille désormais `VideoObject | ImageObject`
(cf. docs/05-TIMELINE). Conforme à docs/02, docs/06, docs/18, docs/22.
