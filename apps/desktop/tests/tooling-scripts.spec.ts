import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPowerShellArgs, getPowerShellCandidates } from "../../../tooling/scripts/run-powershell.mjs";

describe("cross-platform tooling scripts", () => {
  it("routes root package scripts through the PowerShell runner", () => {
    const packageJsonPath = resolve(import.meta.dirname, "../../../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["desktop:tauri"]).toContain("node ./tooling/scripts/run-powershell.mjs");
    expect(packageJson.scripts.runtime).toContain("node ./tooling/scripts/run-powershell.mjs");
    expect(packageJson.scripts.demo).toContain("node ./tooling/scripts/run-powershell.mjs");
    expect(packageJson.scripts["test:all"]).toContain("node ./tooling/scripts/run-powershell.mjs");
  });

  it("prefers pwsh cross-platform and falls back to powershell on Windows", () => {
    expect(getPowerShellCandidates("linux")).toEqual(["pwsh"]);
    expect(getPowerShellCandidates("darwin")).toEqual(["pwsh"]);
    expect(getPowerShellCandidates("win32")).toEqual(["pwsh", "powershell"]);
  });

  it("adds execution policy bypass only for Windows invocations", () => {
    expect(buildPowerShellArgs("win32", "tooling/scripts/dev.ps1", ["-Tauri"])).toEqual([
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      "tooling/scripts/dev.ps1",
      "-Tauri"
    ]);

    expect(buildPowerShellArgs("linux", "tooling/scripts/dev.ps1", ["-Tauri"])).toEqual([
      "-File",
      "tooling/scripts/dev.ps1",
      "-Tauri"
    ]);
  });
});
