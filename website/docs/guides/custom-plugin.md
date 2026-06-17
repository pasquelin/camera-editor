---
title: Plugin personnalisé
---

# Plugin personnalisé

Générez un squelette avec la CLI :

```bash
npx media-studio create-plugin mon-plugin mon-plugin.ts
```

Un plugin utilise la même API que les built-in (`registerObjectType`,
`registerCommand`, `on`). Voir le blueprint interne `docs/06-PLUGIN-API.md`.
