---
"@media-studio/security": minor
---

Nouveau package `@media-studio/security` : `createSignatureVerifier` (adapte une
vérification crypto injectée au port `PluginVerifier` du Core) et
`createAllowlistVerifier` (vérification sans crypto par allowlist, dev/test). La
vérification cryptographique réelle (clé publique/JWT) est fournie par l'hôte.
Dépend de `core` en type-only. Conforme à docs/15, ADR-0013.
