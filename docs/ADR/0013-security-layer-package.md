# ADR-0013 — Security Layer en package séparé, injecté

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [15-NATIVE-CONFIG-PLUGINS](../15-NATIVE-CONFIG-PLUGINS.md), [06-PLUGIN-API](../06-PLUGIN-API.md), [07-LICENSE-SYSTEM](../07-LICENSE-SYSTEM.md), [08-ASSET-MANAGER](../08-ASSET-MANAGER.md).

## Contexte

Le SDK doit vérifier la licence (JWT), la signature des plugins premium et des
ResourcePacks marketplace, et détecter une altération du bundle. Ces préoccupations de
sécurité ne doivent **ni alourdir le Core**, ni le rendre dépendant d'une
implémentation cryptographique ou réseau particulière — le Core reste pur et sans I/O.

## Décision

La sécurité vit dans un **package `security` indépendant**, exposant une interface
`SecurityLayer` **injectée** dans le Core (jamais importée par lui). Les vérifications
sont **automatiques et internes** : `registerPlugin` déclenche `verifyPlugin`,
`install(pack)` déclenche `verifyPack`, l'init déclenche `verifyLicense`, et
`checkIntegrity` couvre la tamper detection.

## Conséquences

- **Positives** : Core pur et testable (sécurité mockable) ; sécurité activable
  uniquement quand nécessaire (déploiement open-source sans premium peut s'en passer) ;
  algorithmes remplaçables sans toucher au Core ; un point unique pour auditer la
  surface de confiance.
- **Négatives / coûts** : gestion des clés de signature (privée côté éditeur, publique
  embarquée) ; la tamper detection sur bundle JS reste une barrière, pas une garantie
  absolue ; surface à maintenir (formats de signature, rotation de clés).
- **Suivi** : documenter la rotation de clés ; auditer périodiquement la vérification
  avant `onRegister` (aucun plugin premium ne doit l'esquiver).

## Alternatives écartées

- **Sécurité dans le Core** : violerait « Core sans I/O », le couplerait à la crypto et
  au réseau, et le rendrait plus difficile à tester.
- **Pas de signature (confiance implicite)** : inacceptable pour une marketplace et des
  plugins premium commercialisables.
- **Sécurité uniquement côté serveur** : ne protège ni l'installation hors-ligne de
  packs, ni l'intégrité du bundle sur l'appareil.
