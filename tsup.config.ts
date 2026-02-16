import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "main/index.ts",
  },
  outDir: "dist-main",
  format: ["cjs"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["electron", "better-sqlite3"],
  shims: true,
  tsconfig: "tsconfig.main.json",
});
