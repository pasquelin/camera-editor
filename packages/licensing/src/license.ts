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
