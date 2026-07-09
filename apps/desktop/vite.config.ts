import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@dossier/ui-kit": path.resolve(rootDir, "packages/ui-kit/src/index.ts"),
      "@dossier/contracts": path.resolve(rootDir, "packages/contracts/src/index.ts"),
      "@dossier/sample-data": path.resolve(rootDir, "packages/sample-data/src/index.ts")
    }
  },
  test: {
    environment: "jsdom",
    globals: true
  }
});
