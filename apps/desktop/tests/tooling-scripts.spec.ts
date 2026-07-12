import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPowerShellArgs, getPowerShellCandidates } from "../../../tooling/scripts/run-powershell.mjs";
import { collectReleaseEvidence } from "../../../tooling/scripts/collect-release-evidence.mjs";

describe("cross-platform tooling scripts", () => {
  it("routes root package scripts through the PowerShell runner", () => {
    const packageJsonPath = resolve(import.meta.dirname, "../../../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["desktop:tauri"]).toContain("node ./tooling/scripts/run-powershell.mjs");
    expect(packageJson.scripts.runtime).toContain("node ./tooling/scripts/run-powershell.mjs");
    expect(packageJson.scripts.demo).toContain("node ./tooling/scripts/run-powershell.mjs");
    expect(packageJson.scripts.evidence).toContain("node ./tooling/scripts/collect-release-evidence.mjs");
    expect(packageJson.scripts["sales:packet"]).toContain("node ./tooling/scripts/write-sales-packet.mjs");
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

  it("collects release evidence into an ignored local artifact manifest", () => {
    const repoRoot = resolve(import.meta.dirname, "../../..");
    const outDir = mkdtempSync(join(tmpdir(), "dossier-release-evidence-"));
    const result = collectReleaseEvidence({ repoRoot, outDir });

    expect(result.manifestPath).toContain("release_manifest.json");
    expect(result.manifest.git.head).toEqual(expect.any(String));
    expect(result.manifest.verificationCommands).toContain("pnpm --filter @dossier/benchmark bench");
    expect(result.manifest.screenshots).toHaveLength(4);
    expect(result.manifest.benchmark.markdown.path).toContain("benchmark_report.md");
    expect(result.manifest.salesPacket.productBrief.path).toContain("product_brief.md");
    expect(result.manifest.salesPacket.pilotReadiness.path).toContain("pilot_readiness_report.md");
  });
});
