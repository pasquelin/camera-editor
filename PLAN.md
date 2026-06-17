# Plan — Documentation blueprint « Media Studio SDK »

## Contexte

Projet greenfield. On écrit le **blueprint de documentation** qui sert de source de
vérité pour construire le SDK React Native + Expo sur plusieurs années (dev solo).
Les docs *sont* le plan d'architecture : précises, ancrées sur des décisions (ADR),
exhaustives vis-à-vis du brief (rien repoussé à une « V2 » ; les *limites V1* du
brief restent des contraintes assumées). Travail séquencé en **plusieurs passes**.

### Décisions actées
- Profondeur : blueprint complet avec **interfaces TS publiques**, décisions, points
  de config, limites V1 — pas de code d'implémentation.
- Monorepo : **pnpm + Turborepo**.
- Périmètre : **fondations d'abord**, puis itérations par passe.

## Principes transverses (dans chaque doc)
1. **Headless-first + tout override-able** (flags → tokens → slots → headless).
2. **Core fermé / extensible** (registries, CommandBus, PluginManager).
3. **Mutations via CommandBus uniquement** (undo/redo, snapshots).
4. **Preview ≠ Export** (deux pipelines, aucun code partagé).
5. **Bonnes pratiques RN/Expo** (Expo Modules API, New Arch, config plugins,
   worklets Reanimated, Metro monorepo, EAS).

Template de chaque doc : `Purpose → Concepts → Interfaces (TS) → Configuration →
Limites V1 → Décisions liées (ADR) → Cross-refs`.

## Arborescence (cible complète)

```
docs/
  README.md
  00-VISION · 01-ARCHITECTURE · 02-PROJECT-SCHEMA
  03-RUNTIME · 04-RENDERER · 05-TIMELINE
  06-PLUGIN-API · 07-LICENSE-SYSTEM · 08-ASSET-MANAGER · 09-EXPORT-ENGINE
  10-ROADMAP · 11-MONOREPO · 12-CONFIGURATION · 13-STATE-DATAFLOW
  14-TESTING · 15-NATIVE-CONFIG-PLUGINS
  16-CAMERA · 17-PHOTO-EDITOR · 18-VIDEO-EDITOR
  19-TEXT-ENGINE · 20-STICKER-ENGINE · 21-FILTER-ENGINE
  22-AUDIO-ENGINE · 23-TRANSITION-ENGINE · 24-UI-COMPONENTS · 25-DEVELOPER-DOCS
  ADR/  (0000 template + décisions structurantes)
```

## État des passes

### ✅ Passe 1 — Fondations (livrée)
Docs complets (interfaces TS, ✅ stable) : `README`, `00-VISION`, `01-ARCHITECTURE`
(+ annexes Command/Event), `02-PROJECT-SCHEMA`, `11-MONOREPO`, `12-CONFIGURATION`,
`13-STATE-DATAFLOW`.
ADRs : `0000`, `0001` (pnpm+turbo), `0002` (ffmpeg fork+fallback), `0004` (clock),
`0005` (zustand), `0006` (expo modules+new arch), `0007` (commandbus+undo),
`0008` (registries), `0009` (headless+config), `0010` (preview/export),
`0011` (licensing injecté), `0014` (publishing).
Stubs structurés (périmètre figé) pour tous les autres docs → arborescence
représentant 100 % du brief.

### 🟡 Passe 2 — Moteurs temps réel
Détailler `03-RUNTIME`, `04-RENDERER`, `05-TIMELINE` + ADR 0003 (Skia vs vidéo native).

### 🟡 Passe 3 — Extensibilité, moteurs & distribution
Détailler `06`–`09`, `15`–`24` + ADR 0012 (vision-camera), 0013 (security).

### 🟡 Passe 4 — Qualité & exécution
Détailler `14-TESTING`, `10-ROADMAP`, `25-DEVELOPER-DOCS` + revue de cohérence globale.

## Vérification
- Couverture : chaque section du brief a un foyer dans l'arborescence.
- Cross-refs : tout lien `→ ADR-XXXX`/`→ NN-DOC` résout (check automatisé).
- Template respecté ; interfaces TS cohérentes ; zéro TODO/TBD dans les docs stables.
