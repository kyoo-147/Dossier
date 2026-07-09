export interface ProviderResult<TPayload = Record<string, unknown>> {
  providerId: string;
  providerVersion: string;
  payload: TPayload;
  evidenceSummary: string;
}
