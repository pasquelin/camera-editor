/**
 * @media-studio/sdk — point d'entrée unique du SDK Media Studio. Ré-exporte le Core
 * et tous les moteurs headless, et expose la façade `createMediaStudio`. C'est la
 * seule dépendance qu'un intégrateur installe pour le chemin par défaut.
 * Voir docs/11-MONOREPO.md.
 */

// Façade d'intégration
export { createMediaStudio, type MediaStudio, type MediaStudioDeps } from "./media-studio";

// Core
export * from "@media-studio/core";

// Moteurs et services headless
export * from "@media-studio/licensing";
export * from "@media-studio/filter-engine";
export * from "@media-studio/text-engine";
export * from "@media-studio/sticker-engine";
export * from "@media-studio/runtime";
export * from "@media-studio/timeline";
export * from "@media-studio/background-jobs";
export * from "@media-studio/export-engine";
export * from "@media-studio/security";
export * from "@media-studio/asset-manager";
export * from "@media-studio/transition-engine";
export * from "@media-studio/audio-engine";
export * from "@media-studio/camera";

// Contrôleurs d'édition headless
export * from "@media-studio/video-editor";
export * from "@media-studio/photo-editor";
