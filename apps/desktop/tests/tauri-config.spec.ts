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
    expect(config.build.beforeDevCommand).toContain("pnpm --dir ../.. dev");
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
});
