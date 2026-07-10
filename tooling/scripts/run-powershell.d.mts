export function getPowerShellCandidates(platform?: NodeJS.Platform): string[];

export function buildPowerShellArgs(
  platform: NodeJS.Platform,
  scriptPath: string,
  forwardedArgs?: string[]
): string[];

export function resolvePowerShellBinary(platform?: NodeJS.Platform): string;
