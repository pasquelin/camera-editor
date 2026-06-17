# ADR-0011 — Licence optionnelle, injectée par interface

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [07-LICENSE-SYSTEM](../07-LICENSE-SYSTEM.md), [12-CONFIGURATION](../12-CONFIGURATION.md), [01-ARCHITECTURE](../01-ARCHITECTURE.md), [00-VISION](../00-VISION.md).

## Contexte

Le SDK est open-core : utilisable **sans licence** pour le périmètre libre, mais
commercialisable (Pro/Enterprise) pour les capacités avancées (export 4K, H.265,
effets premium). Le Core ne doit **faire aucun accès réseau** ni dépendre du système
de licence ; et l'expiration ne doit jamais casser brutalement une session d'édition.

## Décision

Le package `licensing` implémente une **interface `LicenseValidator` injectée** dans
le Core (jamais importée). La licence est **optionnelle** : sans clé, le périmètre
libre fonctionne. Validation JWT en ligne à l'init, **cache local TTL 7 jours**,
**expiration gracieuse** (avertissement avant blocage), révocation par liste noire.
Les capacités gated retombent en mode dégradé (warning + fallback libre), jamais en
crash. → flags dans [12-CONFIGURATION](../12-CONFIGURATION.md).

## Conséquences

- **Positives** : Core sans réseau ni dépendance licence (testable, pur) ;
  open-core réel (marche sans clé) ; UX robuste (pas de blocage sec hors-ligne) ;
  licence remplaçable/désactivable.
- **Négatives / coûts** : la logique de gating doit être présente aux points de
  capacité (export, filtres) ; gestion d'un cache et de ses TTL ; signature/clé à
  protéger (cf. [security](../15-NATIVE-CONFIG-PLUGINS.md), package `security`).
- **Suivi** : tester les transitions online→offline→expiré ; tolérance d'horloge.

## Alternatives écartées

- **Licence obligatoire/online-only** : casse l'open-core et l'usage hors-ligne.
- **Vérification dans le Core** : violerait « Core sans réseau » et le couplerait au
  business model.
- **Blocage dur à l'expiration** : UX inacceptable en plein montage.
