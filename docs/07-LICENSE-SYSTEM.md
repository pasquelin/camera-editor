# 07 — License System

> **Statut : 🟡 planifié — Passe 3.** Périmètre figé ci-dessous.

## Purpose

Système de licences **optionnel** et non intrusif, injecté dans le Core par
interface. Sépare le périmètre open-source des capacités commerciales (Pro,
Enterprise) sans jamais bloquer brutalement l'édition. → [ADR-0011](./ADR/0011-licensing-injected-interface.md).

## Périmètre (à détailler)

- **Plans** : Open Source (Core + modules de base) · Pro (export 4K, H.265, effets
  avancés, plugins premium) · Enterprise (whitelabel, support, SLA, analytics).
- Initialisation : `MediaStudio.initialize({ licenseKey, offlineCache })`.
- Validation : JWT online à l'init · cache local **TTL 7 jours** · **expiration
  gracieuse** (warning avant blocage) · révocation par liste noire serveur.
- Gating des capacités → fallback libre (jamais de crash). Flags :
  [12-CONFIGURATION](./12-CONFIGURATION.md).
- Le **Core ne fait aucun accès réseau** : tout passe par l'adapter injecté.

## Cross-refs

- [12-CONFIGURATION](./12-CONFIGURATION.md) — capacités gated.
- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — Security Layer (signatures).
