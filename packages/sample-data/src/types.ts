export type SampleDataBucket = "clean" | "noisy" | "handwriting" | "risk" | "golden";
export type SampleDataIndustry = "healthcare" | "finance" | "enterprise";

export interface SampleFieldExpectation {
  schemaKey: string;
  value: string;
  required: boolean;
}

export interface DemoWorkspaceRecord {
  documentTitle: string;
  subtitle: string;
  fields: Array<{ label: string; value: string; status: "approved" | "warning" }>;
  riskScore: string;
  riskSummary: string[];
  warnings: string[];
  logs: string[];
}

export interface SampleFixture {
  fixtureId: string;
  bucket: SampleDataBucket;
  industry: SampleDataIndustry;
  mode: "quick_ocr" | "generic_parse" | "schema_workflow";
  fileName: string;
  expectedFields: SampleFieldExpectation[];
  expectedReview: boolean;
  expectedLatencyMs: number;
  workspace: DemoWorkspaceRecord;
}
