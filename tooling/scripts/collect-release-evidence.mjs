import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeSalesPacket } from "./write-sales-packet.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = resolve(scriptDir, "..", "..");

export const evidenceRelativePaths = {
  benchmarkJson: "artifacts/release-evidence/benchmark/benchmark_report.json",
  benchmarkMarkdown: "artifacts/release-evidence/benchmark/benchmark_report.md",
  screenshots: [
    "apps/desktop/e2e/regression.spec.ts-snapshots/workspace-1440x960-chromium-win32.png",
    "apps/desktop/e2e/regression.spec.ts-snapshots/review-1440x960-chromium-win32.png",
    "apps/desktop/e2e/regression.spec.ts-snapshots/inbox-1440x960-chromium-win32.png",
    "apps/desktop/e2e/regression.spec.ts-snapshots/settings-1440x960-chromium-win32.png"
  ],
  installers: [
    "apps/desktop/src-tauri/target/release/bundle/msi/Dossier_0.1.0_x64_en-US.msi",
    "apps/desktop/src-tauri/target/release/bundle/nsis/Dossier_0.1.0_x64-setup.exe"
  ],
  salesPacket: {
    productBrief: "artifacts/release-evidence/sales/product_brief.md",
    pitchDeck: "artifacts/release-evidence/sales/pitch_deck.md",
    securityBrief: "artifacts/release-evidence/sales/security_deployment_brief.md",
    pilotProposal: "artifacts/release-evidence/sales/pilot_proposal_template.md",
    roiCalculator: "artifacts/release-evidence/sales/roi_calculator.md",
    demoChecklist: "artifacts/release-evidence/sales/demo_checklist.md",
    pilotReadiness: "artifacts/release-evidence/sales/pilot_readiness_report.md"
  }
};

function fileRecord(repoRoot, relativePath) {
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return { path: relativePath, exists: false };
  }

  const buffer = readFileSync(absolutePath);
  const stats = statSync(absolutePath);
  return {
    path: relativePath,
    exists: true,
    size: stats.size,
    sha256: createHash("sha256").update(buffer).digest("hex")
  };
}

function gitValue(repoRoot, command, fallback) {
  try {
    return execSync(command, { cwd: repoRoot, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}

export function collectReleaseEvidence(options = {}) {
  const repoRoot = options.repoRoot ? resolve(options.repoRoot) : defaultRepoRoot;
  const outDir = options.outDir ? resolve(options.outDir) : resolve(repoRoot, "artifacts", "release-evidence");
  mkdirSync(outDir, { recursive: true });
  writeSalesPacket({ outDir: resolve(outDir, "sales") });

  const manifest = {
    generatedAt: new Date().toISOString(),
    git: {
      head: gitValue(repoRoot, "git rev-parse --short HEAD", "unknown"),
      branch: gitValue(repoRoot, "git branch --show-current", "unknown"),
      statusShort: gitValue(repoRoot, "git status --short", "")
    },
    verificationCommands: [
      "python -m pytest -q",
      "pnpm test",
      "pnpm build",
      "cargo test --manifest-path apps\\desktop\\src-tauri\\Cargo.toml",
      "pnpm exec playwright test",
      "pnpm --filter @dossier/benchmark bench",
      "pnpm -F @dossier/desktop tauri:build"
    ],
    benchmark: {
      json: fileRecord(repoRoot, evidenceRelativePaths.benchmarkJson),
      markdown: fileRecord(repoRoot, evidenceRelativePaths.benchmarkMarkdown)
    },
    screenshots: evidenceRelativePaths.screenshots.map((path) => fileRecord(repoRoot, path)),
    installers: evidenceRelativePaths.installers.map((path) => fileRecord(repoRoot, path)),
    salesPacket: Object.fromEntries(
      Object.entries(evidenceRelativePaths.salesPacket).map(([key, path]) => [key, fileRecord(repoRoot, path)])
    )
  };

  const manifestPath = resolve(outDir, "release_manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
  return { manifest, manifestPath: relative(repoRoot, manifestPath) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = collectReleaseEvidence();
  console.log(JSON.stringify(result, null, 2));
}
