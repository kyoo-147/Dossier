export interface EvidenceFileRecord {
  path: string;
  exists: boolean;
  size?: number;
  sha256?: string;
}

export interface ReleaseEvidenceManifest {
  generatedAt: string;
  git: {
    head: string;
    branch: string;
    statusShort: string;
  };
  verificationCommands: string[];
  benchmark: {
    json: EvidenceFileRecord;
    markdown: EvidenceFileRecord;
  };
  screenshots: EvidenceFileRecord[];
  installers: EvidenceFileRecord[];
  salesPacket: {
    productBrief: EvidenceFileRecord;
    pitchDeck: EvidenceFileRecord;
    securityBrief: EvidenceFileRecord;
    pilotProposal: EvidenceFileRecord;
    roiCalculator: EvidenceFileRecord;
    demoChecklist: EvidenceFileRecord;
    pilotReadiness: EvidenceFileRecord;
  };
}

export interface ReleaseEvidenceResult {
  manifest: ReleaseEvidenceManifest;
  manifestPath: string;
}

export const evidenceRelativePaths: {
  benchmarkJson: string;
  benchmarkMarkdown: string;
  screenshots: string[];
  installers: string[];
  salesPacket: Record<string, string>;
};

export function collectReleaseEvidence(options?: {
  repoRoot?: string;
  outDir?: string;
}): ReleaseEvidenceResult;
