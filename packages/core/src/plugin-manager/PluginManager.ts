import type { Core } from "../core/Core";
import { RegistryMap } from "../utils/registry";

export interface MediaStudioPlugin {
  id: string;
  version: string;
  signature?: string;
  onRegister(editor: Core): void;
  onDestroy?(): void;
}

/** Vérificateur de signature injecté (implémenté par @media-studio/security). */
export interface PluginVerifier {
  verifyPlugin(plugin: MediaStudioPlugin): Promise<boolean>;
}

/**
 * Enregistre/détruit les plugins. La signature des plugins premium est vérifiée
 * avant `onRegister`. Voir docs/06-PLUGIN-API.md et docs/ADR/0013-security-layer-package.md.
 */
export class PluginManager {
  private readonly plugins = new RegistryMap<MediaStudioPlugin>();

  constructor(
    private readonly editor: Core,
    private readonly verifier?: PluginVerifier,
  ) {}

  async register(plugin: MediaStudioPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`PluginManager: plugin déjà enregistré: "${plugin.id}"`);
    }
    if (plugin.signature !== undefined && this.verifier) {
      const ok = await this.verifier.verifyPlugin(plugin);
      if (!ok) throw new Error(`PluginManager: signature invalide pour "${plugin.id}"`);
    }
    plugin.onRegister(this.editor);
    this.plugins.set(plugin.id, plugin, "PluginManager");
  }

  destroy(id: string): void {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    plugin.onDestroy?.();
    this.plugins.delete(id);
  }

  list(): MediaStudioPlugin[] {
    return this.plugins.values();
  }
}
