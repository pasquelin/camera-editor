import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: true,
  target: "es2022",
  banner: { js: "#!/usr/bin/env node" },
});
