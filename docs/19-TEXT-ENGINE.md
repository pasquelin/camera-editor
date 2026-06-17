# 19 — Text Engine

> **Statut : 🟡 planifié — Passe 3 (Phase 1 roadmap).** Périmètre figé ci-dessous.
> Le type `TextStyle` / `TextAnimation` est défini dans [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).

## Purpose

Rendu et stylisation de texte (Skia), styles prédéfinis, animations, et gestion des
polices.

## Périmètre (à détailler)

- **Styles prédéfinis** : Classic, Minimal, Bold, Elegant, Neon, Handwriting, Typewriter.
- **Paramètres** : `TextStyle` (fontFamily, fontSize, color, gradient, stroke,
  background, shadow, letterSpacingPx, lineHeight, align, opacity).
- **Animations** : fadeIn, fadeOut, slideUp/Down/Left/Right, zoom, bounce, typewriter.
- **Font Manager** : fonts système · fonts bundlées dans le SDK · fonts issues d'un
  `FontPack` ([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)).
- Fonts additionnelles configurables via `config.fonts`
  ([12-CONFIGURATION](./12-CONFIGURATION.md)).

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `TextObject`, `TextStyle`, `TextAnimation`.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<TextEditor />`.
