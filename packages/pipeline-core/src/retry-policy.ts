import type { RetryPolicy } from "@dossier/contracts";

export function shouldRetry(attempt: number, retryPolicy: RetryPolicy): boolean {
  return attempt < retryPolicy.max_attempts;
}

export function nextRetryStrategy(
  attempt: number,
  retryPolicy: RetryPolicy
): RetryPolicy["strategies"][number] | null {
  return retryPolicy.strategies[attempt] ?? null;
}
