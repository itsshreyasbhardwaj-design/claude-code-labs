import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  target: "node18",
  platform: "node",
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // package.json "dependencies" (commander, ink, react, ...) stay external by tsup's default
  // behavior — npm installs them normally for consumers. Bundling them in would require also
  // resolving ink's *optional* react-devtools-core import, which isn't installed by design.
  banner: {
    js: "#!/usr/bin/env node",
  },
});
