import type { Asset } from "./assets";
import type { EditorObject, Project } from "./project";

/** Catalogue des événements de l'EventBus — voir docs/01-ARCHITECTURE.md (Annexe B). */
export interface EditorEventMap {
  "object:selected": EditorObject;
  "object:updated": EditorObject;
  "object:deleted": string;
  "timeline:changed": void;
  "timeline:seeked": number;
  "project:saved": void;
  "project:loaded": Project;
  "runtime:play": void;
  "runtime:pause": void;
  "export:started": void;
  "export:progress": number;
  "export:completed": string;
  "export:failed": Error;
  "asset:imported": Asset;
  "license:validated": void;
  "license:expired": void;
}
