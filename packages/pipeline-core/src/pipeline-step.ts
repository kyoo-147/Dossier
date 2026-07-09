import type { PipelineStep } from "@dossier/contracts";

export interface PipelinePlan {
  pipelineId: string;
  pipelineVersion: string;
  steps: PipelineStep[];
}

export function createPipelinePlan(
  pipelineId: string,
  pipelineVersion: string,
  steps: PipelineStep[]
): PipelinePlan {
  return {
    pipelineId,
    pipelineVersion,
    steps
  };
}
