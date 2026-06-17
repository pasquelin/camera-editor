# 22 — Audio Engine & Music Library

> **Statut : 🟡 planifié — Passe 3 (Phase 3 roadmap).** Périmètre figé ci-dessous.

## Purpose

Gestion des pistes audio (trim, volume, fades, speed, loop) et bibliothèque musicale
libre de droits intégrée.

## Périmètre (à détailler)

### Audio Engine
- **Sources** : fichier local (URI), URL distante (stream), `MusicPack`
  ([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)).
- **Fonctions** : trim (in/out), volume (0–2), fade in/out (ms), speed (0.5x–2x), loop.
- **Pistes simultanées** : 1 musique de fond · 1 voice-over · N sons courts (SFX),
  dans la limite de **5 audio tracks** (limite V1).
- `AudioObject` : [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).

### Music Library
- Intégrée au SDK, libre de droits.
- **Catégories** : Pop, Lo-Fi, Hip-Hop, Electronic, Corporate, Cinematic, Nature.
- Bibliothèque remplaçable via `config.musicLibrary`
  ([12-CONFIGURATION](./12-CONFIGURATION.md)).
- Intégrations futures (plugin) : Pixabay Music, Free Music Archive, Jamendo.

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) — mixage synchronisé à la clock.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<AudioPicker />`.
