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
