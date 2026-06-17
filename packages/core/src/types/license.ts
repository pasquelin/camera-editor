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
