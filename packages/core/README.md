# @media-studio/core

Noyau pur du SDK Media Studio. **Aucune dépendance npm externe**, aucune UI, aucun
accès réseau (délégué via interfaces injectées).

Modules : `ProjectManager`, `CommandBus`, `EventBus`, `PluginManager`,
`ObjectRegistry`, `SchemaRegistry`, `AssetManager`, agrégés par `Core`.

Référence : [docs/01-ARCHITECTURE.md](../../docs/01-ARCHITECTURE.md),
[docs/02-PROJECT-SCHEMA.md](../../docs/02-PROJECT-SCHEMA.md).

```ts
import { Core } from "@media-studio/core";

const core = new Core();
core.registerCommand("text.create", (payload) => ({
  id: "text.create",
  execute(ctx) {
    /* muter via ctx.project.mutate(...) */
  },
  undo(ctx) {
    /* inverse */
  },
}));
core.execute("text.create", { content: "Hello" });
core.undo();
```
