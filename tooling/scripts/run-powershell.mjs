import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export function getPowerShellCandidates(platform = process.platform) {
  return platform === "win32" ? ["pwsh", "powershell"] : ["pwsh"];
}

export function buildPowerShellArgs(platform, scriptPath, forwardedArgs = []) {
  const args = [];
  if (platform === "win32") {
    args.push("-ExecutionPolicy", "Bypass");
  }
  args.push("-File", scriptPath, ...forwardedArgs);
  return args;
}

export function resolvePowerShellBinary(platform = process.platform) {
  for (const candidate of getPowerShellCandidates(platform)) {
    const probe = spawnSync(candidate, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], {
      stdio: "pipe",
      shell: false
    });
    if (probe.status === 0) {
      return candidate;
    }
  }

  throw new Error(
    platform === "win32"
      ? "PowerShell was not found. Install PowerShell 7 (pwsh) or ensure Windows PowerShell is available."
      : "PowerShell 7 (pwsh) was not found. Install pwsh to use the desktop tooling scripts on this platform."
  );
}

function main() {
  const [scriptArg, ...forwardedArgs] = process.argv.slice(2);
  if (!scriptArg) {
    throw new Error("Usage: node tooling/scripts/run-powershell.mjs <script.ps1> [args...]");
  }

  const scriptPath = resolve(process.cwd(), scriptArg);
  const binary = resolvePowerShellBinary(process.platform);
  const args = buildPowerShellArgs(process.platform, scriptPath, forwardedArgs);
  const result = spawnSync(binary, args, { stdio: "inherit", shell: false });

  if (typeof result.status === "number") {
    process.exit(result.status);
  }
  process.exit(1);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";
if (currentFile === invokedFile) {
  main();
}
