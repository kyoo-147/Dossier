import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri desktop config", () => {
  it("runs build and dev commands from the repository root", () => {
    const configPath = resolve(import.meta.dirname, "../src-tauri/tauri.conf.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      build: { beforeBuildCommand: string; beforeDevCommand: string };
    };

    expect(config.build.beforeBuildCommand).toContain("pnpm --dir ../.. build");
    expect(config.build.beforeBuildCommand).toContain("prepare-runtime-resource.mjs");
    expect(config.build.beforeDevCommand).toContain("pnpm --dir ../.. --filter @dossier/desktop dev");
    expect(config.build.beforeDevCommand).toContain("--host 127.0.0.1 --port 5173");
  });

  it("declares explicit desktop bundle icons for native packaging", () => {
    const configPath = resolve(import.meta.dirname, "../src-tauri/tauri.conf.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      bundle?: { icon?: string[] };
    };

    expect(config.bundle?.icon).toEqual(
      expect.arrayContaining([
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ])
    );
  });

  it("bundles a prepared runtime resource instead of the source test tree", () => {
    const configPath = resolve(import.meta.dirname, "../src-tauri/tauri.conf.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      bundle?: { resources?: Record<string, string> };
    };

    expect(config.bundle?.resources).toEqual({
      "runtime-resource/local-runtime": "local-runtime"
    });
  });
});
