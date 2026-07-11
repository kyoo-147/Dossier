import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const sourceRoot = resolve(repoRoot, "apps/local-runtime");
const destinationRoot = resolve(repoRoot, "apps/desktop/src-tauri/runtime-resource/local-runtime");

await rm(destinationRoot, { recursive: true, force: true });
await mkdir(destinationRoot, { recursive: true });
await cp(resolve(sourceRoot, "pyproject.toml"), resolve(destinationRoot, "pyproject.toml"));
await cp(resolve(sourceRoot, "src"), resolve(destinationRoot, "src"), { recursive: true });

console.log(`Prepared runtime resource at ${destinationRoot}`);
