import type { RunStatus } from "@dossier/contracts";

const transitions: Record<RunStatus, RunStatus[]> = {
  created: ["queued"],
  queued: ["running", "canceled", "failed"],
  running: ["needs_review", "approved", "completed", "failed", "canceled"],
  needs_review: ["running", "approved", "rejected", "failed", "canceled"],
  approved: ["completed", "failed"],
  completed: [],
  rejected: [],
  failed: [],
  canceled: []
};

export function canTransitionRunStatus(
  currentStatus: RunStatus,
  nextStatus: RunStatus
): boolean {
  return transitions[currentStatus].includes(nextStatus);
}

export function advanceRunState(
  currentStatus: RunStatus,
  nextStatus: RunStatus
): RunStatus {
  if (!canTransitionRunStatus(currentStatus, nextStatus)) {
    throw new Error(`Invalid run transition: ${currentStatus} -> ${nextStatus}`);
  }

  return nextStatus;
}
