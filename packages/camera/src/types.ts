/**
 * Contrats du module caméra. La capture réelle (flux, permissions, déclenchement)
 * est native (react-native-vision-camera + module Expo) ; ce package porte l'état de
 * session headless, les bornes et l'intégration au projet. Voir docs/16-CAMERA.md.
 */

export type FlashMode = "auto" | "on" | "off" | "torch";
export type CameraRatio = "9:16" | "16:9" | "1:1" | "4:3";
export type CameraFacing = "front" | "back";

export interface PointOfInterest {
  x: number; // [0, 1] normalisé
  y: number; // [0, 1] normalisé
}

/** Résultat d'une capture photo remontée par la couche native. */
export interface PhotoCapture {
  uri: string;
  width: number;
  height: number;
}

/** Résultat d'une capture vidéo (segment) remontée par la couche native. */
export interface VideoCapture {
  uri: string;
  width: number;
  height: number;
  durationMs: number;
}

export interface CameraConfig {
  defaultFacing?: CameraFacing; // défaut "back"
  defaultRatio?: CameraRatio; // défaut "9:16"
  defaultFlash?: FlashMode; // défaut "auto"
  maxSegments?: number; // défaut illimité
}
