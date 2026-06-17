/**
 * @media-studio/security — vérification de signature des plugins, injectée dans le
 * Core via le port `PluginVerifier`. La vérification cryptographique réelle (clé
 * publique, JWT) est fournie par l'hôte via le port `verify` ; ce package fournit
 * l'adaptateur et une variante allowlist sans crypto (dev/test).
 * Voir docs/15-NATIVE-CONFIG-PLUGINS.md, ADR-0013.
 */
import type { MediaStudioPlugin, PluginVerifier } from "@media-studio/core";

/** Vérification cryptographique d'un plugin (implémentation native/hôte injectée). */
export type VerifyFn = (plugin: MediaStudioPlugin) => boolean | Promise<boolean>;

/** Adapte une fonction de vérification au port `PluginVerifier` du Core. */
export function createSignatureVerifier(verify: VerifyFn): PluginVerifier {
  return {
    verifyPlugin: async (plugin) => verify(plugin),
  };
}

/**
 * Vérificateur sans crypto : approuve un plugin si sa `signature` figure dans
 * l'allowlist fournie. Utile en développement et pour les tests ; en production,
 * préférer `createSignatureVerifier` avec une vérification de clé réelle.
 */
export function createAllowlistVerifier(allowedSignatures: readonly string[]): PluginVerifier {
  const allowed = new Set(allowedSignatures);
  return {
    verifyPlugin: async (plugin) => plugin.signature !== undefined && allowed.has(plugin.signature),
  };
}
