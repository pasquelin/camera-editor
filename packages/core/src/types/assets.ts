/** Gestion des assets — voir docs/08-ASSET-MANAGER.md. */

export type AssetType =
  | "video"
  | "image"
  | "audio"
  | "font"
  | "sticker"
  | "template"
  | "filter"
  | "transition";

export type AssetSource =
  | { kind: "local"; path: string }
  | { kind: "remote"; url: string }
  | { kind: "marketplace"; packId: string; assetId: string };

export interface Asset {
  id: string;
  type: AssetType;
  uri: string; // URI local après import
  source: AssetSource;
  size: number; // bytes
  createdAt: string; // ISO8601
  pack?: string; // référence ResourcePack si applicable
}

export interface ResourcePack {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  license: "free" | "pro" | "enterprise";
  assets: Asset[];
  signature: string;
}
