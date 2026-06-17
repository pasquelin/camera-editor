# Licensing (slice simple) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fournir une licence minimale qui débloque des capacités premium (`LicenseValidator` + policy plan→capacités + hook Core), sans réseau ni cache.

**Architecture:** Le contrat (types `LicensePlan`, `Capability`, `LicenseValidator`) vit dans `@media-studio/core`. Un nouveau package `@media-studio/licensing` (dépendance type-only sur core) porte la policy business `PLAN_CAPABILITIES` et la fabrique `createLicense(plan)`. Le Core expose `core.license` (validateur injecté, sinon défaut open-source refusant tout premium). Aucune logique réseau dans le Core.

**Tech Stack:** TypeScript strict (monorepo pnpm + Turborepo), tsup (build ESM+dts), vitest (tests). Conventions existantes du package `core`.

**Référence spec :** `docs/superpowers/specs/2026-06-17-licensing-design.md`.

---

## Structure des fichiers

**Créés :**
- `packages/core/src/types/license.ts` — types du contrat (`LicensePlan`, `Capability`, `LicenseValidator`).
- `packages/licensing/package.json` — manifest du package `@media-studio/licensing`.
- `packages/licensing/tsconfig.json` — config TS du package (calquée sur `core`).
- `packages/licensing/tsup.config.ts` — config build (calquée sur `core`).
- `packages/licensing/vitest.config.ts` — config tests (calquée sur `core`).
- `packages/licensing/src/index.ts` — surface publique (`PLAN_CAPABILITIES`, `createLicense`, ré-export des types).
- `packages/licensing/src/license.ts` — `PLAN_CAPABILITIES` + `createLicense`.
- `packages/licensing/src/license.test.ts` — tests de la policy.
- `packages/core/src/core/Core.license.test.ts` — tests du hook Core.

**Modifiés :**
- `packages/core/src/types/index.ts` — ré-exporter les types license.
- `packages/core/src/index.ts` — exporter les types license depuis le point d'entrée.
- `packages/core/src/core/Core.ts` — `CoreDependencies.license?`, getter `core.license`, défaut open-source.

---

## Task 1 : Types du contrat de licence (dans core)

**Files:**
- Create: `packages/core/src/types/license.ts`
- Modify: `packages/core/src/types/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1 : Écrire le fichier de types**

Create `packages/core/src/types/license.ts` :

```ts
/**
 * Contrat de licence injecté dans le Core. Le Core n'embarque aucune policy
 * business (le mapping plan → capacités vit dans @media-studio/licensing) ni
 * aucun accès réseau. Voir docs/07-LICENSE-SYSTEM.md, ADR-0011.
 */

export type LicensePlan = "open-source" | "pro" | "enterprise";

export type Capability =
  | "export.4k"
  | "export.h265"
  | "effects.advanced"
  | "plugins.premium"
  | "whitelabel"
  | "analytics";

/** Validateur de licence injecté (interface minimale ; extensible plus tard). */
export interface LicenseValidator {
  readonly plan: LicensePlan;
  has(capability: Capability): boolean;
}
```

- [ ] **Step 2 : Ré-exporter depuis types/index.ts**

Read `packages/core/src/types/index.ts`, puis ajouter la ligne de ré-export (suivre le style des autres ré-exports `export type * from "./xxx";` du fichier) :

```ts
export type * from "./license";
```

- [ ] **Step 3 : Exporter depuis le point d'entrée du package**

Dans `packages/core/src/index.ts`, sous le bloc « Contrats (types) », ajouter :

```ts
export type { LicensePlan, Capability, LicenseValidator } from "./types/license";
```

- [ ] **Step 4 : Vérifier le typecheck du core**

Run: `pnpm -F @media-studio/core typecheck`
Expected: aucune erreur (sortie vide après `$ tsc --noEmit`).

- [ ] **Step 5 : Commit**

```bash
git add packages/core/src/types/license.ts packages/core/src/types/index.ts packages/core/src/index.ts
git commit -m "feat(core): contrat de licence (LicensePlan, Capability, LicenseValidator)"
```

---

## Task 2 : Scaffold du package @media-studio/licensing

**Files:**
- Create: `packages/licensing/package.json`
- Create: `packages/licensing/tsconfig.json`
- Create: `packages/licensing/tsup.config.ts`
- Create: `packages/licensing/vitest.config.ts`

> Note : ces 4 fichiers sont calqués sur le package `core` existant. Lire d'abord
> `packages/core/package.json`, `packages/core/tsconfig.json`,
> `packages/core/tsup.config.ts`, `packages/core/vitest.config.ts` pour confirmer
> les versions/réglages, puis créer les équivalents ci-dessous.

- [ ] **Step 1 : Créer package.json**

Create `packages/licensing/package.json` :

```json
{
  "name": "@media-studio/licensing",
  "version": "0.0.0",
  "description": "Système de licence du SDK Media Studio — policy plan → capacités, injecté dans le Core. Zéro dépendance runtime.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@media-studio/core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.3.5",
    "typescript": "^5.6.3",
    "vitest": "^2.1.8"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

- [ ] **Step 2 : Créer tsconfig.json**

Create `packages/licensing/tsconfig.json` (copier le contenu de `packages/core/tsconfig.json` à l'identique ; il étend `../../tsconfig.base.json`). Si `packages/core/tsconfig.json` contient une section `references`, la reproduire en pointant vers core :

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

> Avant d'écrire, lire `packages/core/tsconfig.json` et aligner exactement les
> `compilerOptions` réels (ne pas inventer de champs). Reproduire la même forme.

- [ ] **Step 3 : Créer tsup.config.ts**

Create `packages/licensing/tsup.config.ts` (copie conforme de `packages/core/tsup.config.ts`) :

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
});
```

- [ ] **Step 4 : Créer vitest.config.ts**

Create `packages/licensing/vitest.config.ts` (copie conforme de `packages/core/vitest.config.ts`) :

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 5 : Installer (lier le workspace)**

Run: `pnpm install`
Expected: l'installation se termine sans erreur ; `@media-studio/licensing` apparaît comme package du workspace.

- [ ] **Step 6 : Commit**

```bash
git add packages/licensing/package.json packages/licensing/tsconfig.json packages/licensing/tsup.config.ts packages/licensing/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(licensing): scaffold du package @media-studio/licensing"
```

---

## Task 3 : Policy `PLAN_CAPABILITIES` + `createLicense` (TDD)

**Files:**
- Create: `packages/licensing/src/license.ts`
- Test: `packages/licensing/src/license.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Create `packages/licensing/src/license.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { Capability, LicensePlan } from "@media-studio/core";
import { PLAN_CAPABILITIES, createLicense } from "./license";

const ALL_PLANS: LicensePlan[] = ["open-source", "pro", "enterprise"];
const PREMIUM: Capability[] = [
  "export.4k",
  "export.h265",
  "effects.advanced",
  "plugins.premium",
  "whitelabel",
  "analytics",
];

describe("createLicense", () => {
  it("par défaut : plan open-source, aucune capacité premium", () => {
    const license = createLicense();
    expect(license.plan).toBe("open-source");
    for (const cap of PREMIUM) {
      expect(license.has(cap)).toBe(false);
    }
  });

  it("pro : export 4K/H.265, effets avancés, plugins premium ; pas whitelabel/analytics", () => {
    const license = createLicense("pro");
    expect(license.plan).toBe("pro");
    expect(license.has("export.4k")).toBe(true);
    expect(license.has("export.h265")).toBe(true);
    expect(license.has("effects.advanced")).toBe(true);
    expect(license.has("plugins.premium")).toBe(true);
    expect(license.has("whitelabel")).toBe(false);
    expect(license.has("analytics")).toBe(false);
  });

  it("enterprise : toutes les capacités", () => {
    const license = createLicense("enterprise");
    expect(license.plan).toBe("enterprise");
    for (const cap of PREMIUM) {
      expect(license.has(cap)).toBe(true);
    }
  });

  it("cohérence has(c) <=> c ∈ PLAN_CAPABILITIES[plan] pour chaque plan", () => {
    for (const plan of ALL_PLANS) {
      const license = createLicense(plan);
      for (const cap of PREMIUM) {
        expect(license.has(cap)).toBe(PLAN_CAPABILITIES[plan].includes(cap));
      }
    }
  });
});
```

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `pnpm -F @media-studio/licensing test`
Expected: FAIL — `Failed to load url ./license` (le module n'existe pas encore).

- [ ] **Step 3 : Écrire l'implémentation minimale**

Create `packages/licensing/src/license.ts` :

```ts
/**
 * Policy de licence : mapping plan → capacités, et fabrique d'un LicenseValidator.
 * Aucune dépendance runtime ; dépend de @media-studio/core en type uniquement.
 * Voir docs/07-LICENSE-SYSTEM.md.
 */
import type { Capability, LicensePlan, LicenseValidator } from "@media-studio/core";

/** Capacités accordées par plan (policy business). */
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

/** Crée un validateur de licence statique pour un plan donné (défaut open-source). */
export function createLicense(plan: LicensePlan = "open-source"): LicenseValidator {
  const capabilities = PLAN_CAPABILITIES[plan];
  return {
    plan,
    has: (capability) => capabilities.includes(capability),
  };
}
```

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `pnpm -F @media-studio/licensing test`
Expected: PASS (4 tests verts).

- [ ] **Step 5 : Commit**

```bash
git add packages/licensing/src/license.ts packages/licensing/src/license.test.ts
git commit -m "feat(licensing): PLAN_CAPABILITIES + createLicense"
```

---

## Task 4 : Surface publique du package

**Files:**
- Create: `packages/licensing/src/index.ts`

- [ ] **Step 1 : Écrire le point d'entrée**

Create `packages/licensing/src/index.ts` :

```ts
/**
 * @media-studio/licensing — policy de licence injectable dans le Core.
 * Voir docs/07-LICENSE-SYSTEM.md.
 */
export { PLAN_CAPABILITIES, createLicense } from "./license";
export type { LicensePlan, Capability, LicenseValidator } from "@media-studio/core";
```

- [ ] **Step 2 : Vérifier le build (ESM + dts)**

Run: `pnpm -F @media-studio/licensing build`
Expected: « Build success » ; génération de `dist/index.js` et `dist/index.d.ts`.

- [ ] **Step 3 : Commit**

```bash
git add packages/licensing/src/index.ts
git commit -m "feat(licensing): surface publique du package"
```

---

## Task 5 : Hook Core (`CoreDependencies.license`, `core.license`) (TDD)

**Files:**
- Test: `packages/core/src/core/Core.license.test.ts`
- Modify: `packages/core/src/core/Core.ts`

> Contexte : `packages/core/src/core/Core.ts` définit `interface CoreDependencies`
> (champs `storage?`, `security?`, `builtins?`) et la classe `Core` (constructeur
> `constructor(deps: CoreDependencies = {})`, méthodes `registerCommand`,
> `registerObjectType`, etc.). On ajoute le champ `license?` et un getter `license`.
> Le défaut est un validateur open-source interne (refuse tout premium).
>
> Le test du Core n'utilise PAS `@media-studio/licensing` (le Core ne dépend pas
> du package licensing) : il fournit un `LicenseValidator` minimal en ligne.

- [ ] **Step 1 : Écrire le test qui échoue**

Create `packages/core/src/core/Core.license.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { Core } from "./Core";
import type { LicenseValidator } from "../types/license";

describe("Core.license", () => {
  it("sans licence injectée : défaut open-source, aucune capacité premium", () => {
    const core = new Core();
    expect(core.license.plan).toBe("open-source");
    expect(core.license.has("plugins.premium")).toBe(false);
    expect(core.license.has("export.4k")).toBe(false);
  });

  it("avec une licence injectée : expose le plan et les capacités fournies", () => {
    const proLicense: LicenseValidator = {
      plan: "pro",
      has: (cap) => cap === "export.4k" || cap === "plugins.premium",
    };
    const core = new Core({ license: proLicense });
    expect(core.license.plan).toBe("pro");
    expect(core.license.has("export.4k")).toBe(true);
    expect(core.license.has("plugins.premium")).toBe(true);
    expect(core.license.has("whitelabel")).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `pnpm -F @media-studio/core test Core.license`
Expected: FAIL — `core.license` n'existe pas (erreur de type / runtime `undefined`).

- [ ] **Step 3 : Implémenter le hook dans Core.ts**

Dans `packages/core/src/core/Core.ts` :

a) Ajouter l'import de type en haut (près des autres `import type`) :

```ts
import type { LicenseValidator } from "../types/license";
```

b) Ajouter le champ à l'interface `CoreDependencies` (après `builtins?`) :

```ts
  /** Validateur de licence injecté. Sans lui, périmètre open-source (aucun premium). */
  license?: LicenseValidator;
```

c) Ajouter une constante de validateur par défaut au-dessus de la classe `Core` :

```ts
/** Validateur par défaut : open-source, refuse toute capacité premium. */
const OPEN_SOURCE_LICENSE: LicenseValidator = {
  plan: "open-source",
  has: () => false,
};
```

d) Ajouter un champ privé readonly + getter dans la classe `Core`. Stocker l'injecté
dans le constructeur. Concrètement :

- Déclarer un champ : `private readonly _license: LicenseValidator;`
- Dans le constructeur, l'assigner : `this._license = deps.license ?? OPEN_SOURCE_LICENSE;`
- Ajouter le getter :

```ts
  /** Validateur de licence courant (injecté ou défaut open-source). */
  get license(): LicenseValidator {
    return this._license;
  }
```

> Respecter le style du fichier (les autres modules sont des `readonly` publics
> assignés dans le constructeur ; ici on veut un getter pour exposer le défaut, d'où
> le champ privé `_license`).

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `pnpm -F @media-studio/core test Core.license`
Expected: PASS (2 tests verts).

- [ ] **Step 5 : Vérifier que toute la suite core reste verte**

Run: `pnpm -F @media-studio/core test`
Expected: PASS — tous les tests existants + les 2 nouveaux.

- [ ] **Step 6 : Commit**

```bash
git add packages/core/src/core/Core.ts packages/core/src/core/Core.license.test.ts
git commit -m "feat(core): hook d'injection de licence (core.license, défaut open-source)"
```

---

## Task 6 : Vérification globale + changeset

**Files:**
- Create: `.changeset/licensing.md`

- [ ] **Step 1 : Pipeline Turbo complet**

Run: `pnpm exec turbo run typecheck test build`
Expected: tous les packages (`core`, `licensing`) en succès (typecheck + test + build verts).

- [ ] **Step 2 : Formatage Prettier**

Run: `pnpm exec prettier --write "packages/licensing/**/*.ts" "packages/core/src/types/license.ts" "packages/core/src/core/Core.ts"`
Puis: `pnpm exec prettier --check "packages/licensing/**/*.ts"`
Expected: « All matched files use Prettier code style! »

- [ ] **Step 3 : Re-lancer les tests après formatage**

Run: `pnpm exec turbo run test`
Expected: tout vert.

- [ ] **Step 4 : Écrire le changeset**

Create `.changeset/licensing.md` :

```markdown
---
"@media-studio/core": minor
"@media-studio/licensing": minor
---

Système de licence minimal. Le `core` expose le contrat injecté (`LicensePlan`,
`Capability`, `LicenseValidator`) et `core.license` (validateur injecté, sinon défaut
open-source refusant toute capacité premium). Nouveau package `@media-studio/licensing`
fournissant la policy `PLAN_CAPABILITIES` et la fabrique `createLicense(plan)`. Sans
réseau ni cache (validation online, grâce, multi-clés reportés). Conforme à docs/07
et ADR-0011.
```

- [ ] **Step 5 : Commit**

```bash
git add .changeset/licensing.md
git commit -m "chore(licensing): changeset"
```

---

## Self-review (effectuée à l'écriture)

- **Couverture spec :** types contrat (Task 1) ✓ ; package + policy `PLAN_CAPABILITIES`/`createLicense` (Tasks 2-4) ✓ ; hook Core défaut open-source (Task 5) ✓ ; tests policy + Core (Tasks 3, 5) ✓ ; exclusions (réseau/cache/grâce/multi-clés/plugins/événements) non implémentées, conforme au périmètre.
- **Placeholders :** aucun ; tout le code des steps est complet. Les fichiers de config (tsconfig/tsup/vitest) demandent de lire l'existant du `core` et de reproduire — contenu type fourni, à aligner sur le réel.
- **Cohérence des types :** `LicensePlan`/`Capability`/`LicenseValidator` (Task 1) réutilisés à l'identique en Tasks 3 et 5 ; `createLicense`/`PLAN_CAPABILITIES` cohérents entre impl (Task 3) et export (Task 4) ; `core.license` (Task 5) typé `LicenseValidator`.
