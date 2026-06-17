# Spec — Licensing (slice simple, Jalon 1)

> Date : 2026-06-17 · Statut : validé · Branche : `feat/licensing`
> Sources de vérité : [docs/07-LICENSE-SYSTEM.md](../../07-LICENSE-SYSTEM.md),
> [docs/ADR/0011-licensing-injected-interface.md](../../ADR/0011-licensing-injected-interface.md).

## Objectif

Fournir un système de licence **volontairement minimal** : une licence débloque des
**capacités premium** (dont, à terme, l'activation des plugins premium). Pas de réseau,
pas de JWT, pas de cache hors-ligne, pas d'expiration gracieuse à ce stade — ces aspects
(validation online, TTL, grâce, multi-clés, analytics) sont **reportés** et l'interface
pourra s'étendre sans rupture.

Principe directeur retenu avec l'utilisateur : « si licence → on active les capacités/
plugins ; les plugins eux-mêmes seront traités à la fin ».

## Portée

**Inclus**
- Contrat de licence (types) dans `@media-studio/core` — source de vérité des types injectés.
- Package `@media-studio/licensing` : policy plan → capacités + fabrique `createLicense`.
- Hook d'injection minimal dans le Core (`CoreDependencies.license`, `core.license`),
  avec un **validateur open-source par défaut** (refuse toute capacité premium).

**Exclu (reporté)**
- Validation online / JWT / Security Layer.
- Cache hors-ligne (TTL `offlineCacheTtlDays`), expiration gracieuse, révocation.
- Multi-clés / multi-seats, analytics Enterprise.
- Gating effectif des plugins premium (sera câblé quand on construira les plugins).
- Émission des événements `license:validated` / `license:expired` (liés à la validation
  online, donc reportés ; les clés d'événements existent déjà dans `EditorEventMap`).

## Contrat (types — dans `core`)

```ts
export type LicensePlan = "open-source" | "pro" | "enterprise";

export type Capability =
  | "export.4k"
  | "export.h265"
  | "effects.advanced"
  | "plugins.premium"
  | "whitelabel"
  | "analytics";

export interface LicenseValidator {
  readonly plan: LicensePlan;
  has(capability: Capability): boolean;
}
```

Ces types vivent dans le Core (qui expose le contrat d'injection) ; le Core n'embarque
**aucune policy business** (le mapping plan → capacités est dans le package licensing).

## Policy (package `@media-studio/licensing`)

```ts
export const PLAN_CAPABILITIES: Record<LicensePlan, readonly Capability[]> = {
  "open-source": [],
  pro: ["export.4k", "export.h265", "effects.advanced", "plugins.premium"],
  enterprise: [
    "export.4k",
    "export.h265",
    "effects.advanced",
    "plugins.premium",
    "whitelabel",
    "analytics",
  ],
};

export function createLicense(plan?: LicensePlan): LicenseValidator;
// défaut "open-source" ; has(cap) = cap ∈ PLAN_CAPABILITIES[plan]
```

- `pro` : couvre les capacités payantes « standard » (export 4K/H.265, effets avancés,
  plugins premium) — aligné sur docs/07 (« Export 4K, H.265, effets avancés, plugins premium »).
- `enterprise` : tout `pro` + `whitelabel` + `analytics` (docs/07).
- `open-source` : aucune capacité premium.

Le package ne dépend de `core` que pour les **types** (`import type`). Zéro dépendance runtime.

## Hook Core

```ts
interface CoreDependencies {
  // … existant (storage, security, builtins)
  license?: LicenseValidator;
}

class Core {
  get license(): LicenseValidator; // injecté, sinon défaut open-source
}
```

- Sans injection, `core.license.plan === "open-source"` et `has(<premium>) === false`
  (défaut sûr, jamais `undefined`).
- Le validateur par défaut est trivial et **interne au Core** (refuse tout premium) —
  ce n'est pas de la policy business, c'est le fallback sûr de l'open-core.
- Aucune logique réseau ni dépendance au package licensing dans le Core (injection pure).

## Architecture & dépendances

```
@media-studio/core
  └─ types: LicensePlan, Capability, LicenseValidator
  └─ Core: CoreDependencies.license?, core.license (défaut open-source)

@media-studio/licensing  (dépend de core en type-only)
  └─ PLAN_CAPABILITIES, createLicense(plan)
```

Respecte l'invariant : `core` ne dépend de rien ; `licensing` dépend de `core`.

## Plan de tests (TDD, vitest)

Package `licensing` :
- `createLicense()` sans argument → plan `open-source`, `has(<toute premium>) === false`.
- `createLicense("pro")` → `has("export.4k") === true`, `has("plugins.premium") === true`,
  `has("whitelabel") === false`.
- `createLicense("enterprise")` → `has("whitelabel") === true`, `has("analytics") === true`.
- Cohérence : pour chaque plan, `has(c)` ⇔ `c ∈ PLAN_CAPABILITIES[plan]`.

Core :
- `new Core()` (sans licence) → `core.license.plan === "open-source"`, `has(premium) === false`.
- `new Core({ license: createLicense("pro") })` → `core.license.has("export.4k") === true`.

## Risques / notes

- L'interface `LicenseValidator` est volontairement réduite (`plan` + `has`). L'ajout
  futur de `validate()`/`current()` (validation online, statut détaillé) sera une
  extension, non une rupture des consommateurs actuels.
- Le gating réel des plugins premium dépend du module plugins (reporté) ; ici on
  garantit seulement que le point d'interrogation (`core.license.has("plugins.premium")`)
  existe et a une valeur sûre par défaut.
