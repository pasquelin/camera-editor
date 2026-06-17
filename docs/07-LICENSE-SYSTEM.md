# 07 — License System

> **Statut : ✅ stable.**

## Purpose

Séparer le périmètre **open source** des capacités **commerciales** (Pro,
Enterprise) via un système de licences **optionnel et non intrusif**, **injecté dans
le Core par interface**. Sans clé, le périmètre libre fonctionne. La licence ne bloque
**jamais brutalement** l'édition : expiration gracieuse, fallback au lieu du crash.
→ [ADR-0011](./ADR/0011-licensing-injected-interface.md).

## Concepts

### Plans

| Plan | Accès |
|------|-------|
| **Open Source** | Core + tous les modules de base. |
| **Pro** | Export 4K, H.265, effets avancés, plugins premium. |
| **Enterprise** | Whitelabel, support, SLA, analytics. |

### Le Core ne fait aucun réseau

Le `licensing` est un package séparé qui implémente une interface **injectée** dans
le Core. Le Core ne connaît ni JWT, ni serveur : il interroge un `LicenseValidator`
abstrait. → [01-ARCHITECTURE](./01-ARCHITECTURE.md).

### Validation et expiration gracieuse

```
initialize({ licenseKey })
        │
        ▼
validation JWT online ──(ok)──▶ cache local (TTL 7 jours) ──▶ license:validated
        │                                    │
     (offline)                          (TTL expiré)
        ▼                                    ▼
lecture du cache ──(valide)──▶ OK     warning « bientôt expiré » ──▶ grâce
        │                                    │
   (cache absent/expiré)              (révoqué ou grâce dépassée)
        ▼                                    ▼
périmètre libre uniquement           license:expired ──▶ fallback libre
```

- **Online** : JWT vérifié à l'init (signature, expiration). → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) (Security Layer).
- **Cache local** : TTL **7 jours par défaut** (configurable via `offlineCacheTtlDays`) pour l'usage hors-ligne.
- **Expiration gracieuse** : avertissement **avant** blocage ; on ne coupe jamais en
  plein montage.
- **Révocation** : liste noire serveur — une clé révoquée retombe au périmètre libre.

## Interfaces (TS)

```ts
// Implémenté par @media-studio/licensing, injecté dans le Core (jamais importé).
interface LicenseValidator {
  validate(key: string): Promise<LicenseStatus>;   // online → cache
  current(): LicenseStatus;                          // état courant (sync)
  has(capability: Capability): boolean;              // gating
}

interface LicenseStatus {
  plan: "open-source" | "pro" | "enterprise";
  valid: boolean;
  expiresAt: string | null;     // ISO8601
  graceUntil: string | null;    // période de grâce après expiration
  revoked: boolean;
}

type Capability =
  | "export.4k" | "export.h265"
  | "effects.advanced" | "plugins.premium"
  | "whitelabel" | "analytics";
```

### Initialisation

```ts
MediaStudio.initialize({
  licenseKey: "XXXX-XXXX-XXXX-XXXX",
  offlineCache: true,
});
```

### Événements

```ts
editor.on("license:validated", () => {});   // clé valide (online ou cache)
editor.on("license:expired",   () => {});   // grâce dépassée → fallback libre
```

## Configuration — capacités gated

Les capacités payantes sont vérifiées **au point d'usage**. Une demande non couverte
**retombe en mode dégradé** (warning + fallback), jamais en crash :

```ts
// Export Engine — gating de la résolution 4K
const target = license.has("export.4k") ? config.resolution : clampTo1080p(config.resolution);
if (target !== config.resolution) warn("4K nécessite un plan Pro — export en 1080p.");
```

| Capacité demandée sans droit | Fallback |
|------------------------------|----------|
| `export.4k` | Export 1080p + warning. |
| `export.h265` | Codec H.264 + warning. |
| `effects.advanced` | Effet de base équivalent. |
| `plugins.premium` | Plugin non chargé (signature/licence). → [06-PLUGIN-API](./06-PLUGIN-API.md). |

- Le flag global et les capacités exactes sont déclarés dans
  [12-CONFIGURATION](./12-CONFIGURATION.md).

## Concepts avancés

### Gestion multi-clés et multi-seats

Le SDK supporte la **gestion de plusieurs licences actives simultanément** (multi-clés /
multi-seats). Un intégrateur peut injecter plusieurs `LicenseValidator` correspondant
à des contextes distincts (organisation, utilisateur, environnement). L'API `initialize`
accepte un tableau de clés ; le SDK résout les capacités par union des droits accordés.

### Cache de validation hors-ligne

Le cache local de validation JWT est configuré à **7 jours par défaut** et entièrement
ajustable via `offlineCacheTtlDays` dans `MediaStudioConfig`. Cette valeur peut être
augmentée ou réduite selon les contraintes de l'intégrateur.

### Analytics (Enterprise)

Le module **analytics** est inclus dans le plan Enterprise et s'injecte dans le Core
via la même interface que le `LicenseValidator`. Il expose des événements d'édition
(sessions, commandes, exports) vers le backend de l'intégrateur, sans que le Core
ne connaisse l'implémentation sous-jacente.

## Décisions liées

- [ADR-0011](./ADR/0011-licensing-injected-interface.md) — licence optionnelle, injectée.
- [ADR-0013](./ADR/0013-security-layer-package.md) — vérification JWT/signature.

## Cross-refs

- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — injection des dépendances du Core.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — capacités gated, flags.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — gating 4K / H.265.
- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — Security Layer.
