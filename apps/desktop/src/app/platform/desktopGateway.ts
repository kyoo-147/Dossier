import type { SampleFixture } from "@dossier/sample-data";

export interface DesktopRuntimeStatus {
  runtime_kind: string;
  configured: boolean;
  workspace_initialized: boolean;
  runtime_running: boolean;
  base_url: string;
  port: number;
}

export interface DesktopWorkspacePaths {
  root: string;
  state_dir: string;
  artifacts_dir: string;
}

export interface DesktopKernelStatus {
  workspace: DesktopWorkspacePaths | null;
  runtime: DesktopRuntimeStatus;
}

export interface RuntimeRunRecord {
  run_id: string;
  document_id: string;
  mode: string;
  pipeline_id: string;
  pipeline_version: string;
  status: string;
  trace_id: string;
  started_at: string;
  finished_at: string | null;
}

export interface RuntimeFieldRecord {
  field_id: string;
  label: string;
  normalized_value: string;
  observed_value?: string;
  human_approved_value?: string | null;
  status?: string;
  confidence?: number;
  warning_codes?: string[];
}

export interface RuntimeReviewTaskRecord {
  review_task_id: string;
  reason_codes: string[];
  status: string;
  priority?: string;
  required_action?: string;
}

export interface RuntimeRevisionRecord {
  revision_id: string;
  run_id: string;
  document_id: string;
  field_id: string | null;
  source: string;
  author_type: string;
  created_at: string;
  summary: string;
  before_value: string | null;
  after_value: string | null;
  note: string | null;
}

export interface RuntimeApprovalAuditRecord {
  approval_id: string;
  run_id: string;
  review_task_id: string | null;
  action: string;
  actor: string;
  created_at: string;
  note: string | null;
  revision_id: string | null;
}

export interface RuntimeExecutionResult {
  run: RuntimeRunRecord;
  fields: RuntimeFieldRecord[];
  warnings: Array<{ code: string; message: string; severity: string }>;
  review_tasks: RuntimeReviewTaskRecord[];
  revisions?: RuntimeRevisionRecord[];
  approval_audit?: RuntimeApprovalAuditRecord[];
  repair?: {
    attempts: Array<{ strategy: string; result: string; warning_code: string }>;
    remaining_warnings: Array<{ code: string; message: string; severity: string }>;
  };
}

export interface DesktopGateway {
  mode: "browser-mock" | "tauri-live";
  getKernelStatus(): Promise<DesktopKernelStatus>;
  initializeWorkspace(workspaceRoot?: string): Promise<DesktopWorkspacePaths>;
  ensureRuntime(): Promise<DesktopRuntimeStatus>;
  processFixture(fixture: SampleFixture): Promise<RuntimeExecutionResult>;
  listReviewTasks(runId: string): Promise<Pick<RuntimeExecutionResult, "review_tasks" | "revisions" | "approval_audit">>;
  applyFieldEdit(runId: string, fieldId: string, newValue: string, note?: string): Promise<RuntimeExecutionResult>;
  approveRun(runId: string): Promise<RuntimeExecutionResult>;
  rejectRun(runId: string, note?: string): Promise<RuntimeExecutionResult>;
  exportRun(runId: string, exportTarget: "json" | "markdown" | "connector"): Promise<{ artifact_ref: string; run: RuntimeRunRecord }>;
}

const mockRuns = new Map<string, RuntimeExecutionResult>();

function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const api = await import("@tauri-apps/api/core");
  return api.invoke<T>(command, args);
}

function buildMockResult(fixture: SampleFixture): RuntimeExecutionResult {
  return {
    run: {
      run_id: `mock_${fixture.fixtureId}`,
      document_id: fixture.fixtureId,
      mode: fixture.mode,
      pipeline_id: `${fixture.industry}_${fixture.mode}`,
      pipeline_version: "0.1.0",
      status: fixture.expectedReview ? "needs_review" : "completed",
      trace_id: `trace_${fixture.fixtureId}`,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    },
    fields: fixture.workspace.fields.map((field, index) => ({
      field_id: `mock_field_${index + 1}`,
      label: field.label,
      normalized_value: field.value,
      observed_value: field.value,
      human_approved_value: null,
      status: field.status,
      warning_codes: field.status === "warning" ? ["MOCK_WARNING"] : []
    })),
    warnings: fixture.workspace.warnings.map((warning) => ({
      code: "MOCK_WARNING",
      message: warning,
      severity: "medium"
    })),
    review_tasks: fixture.expectedReview
      ? [
          {
            review_task_id: `review_${fixture.fixtureId}`,
            reason_codes: ["APPROVAL_REQUIRED"],
            status: "open",
            priority: "medium",
            required_action: "approval"
          }
        ]
      : [],
    revisions: [],
    approval_audit: [],
    repair: {
      attempts: [],
      remaining_warnings: fixture.workspace.warnings.map((warning) => ({
        code: "MOCK_WARNING",
        message: warning,
        severity: "medium"
      }))
    }
  };
}

function createBrowserMockGateway(): DesktopGateway {
  return {
    mode: "browser-mock",
    async getKernelStatus() {
      return {
        workspace: {
          root: "browser-mock-workspace",
          state_dir: "browser-mock-workspace/.dossier/state",
          artifacts_dir: "browser-mock-workspace/.dossier/artifacts"
        },
        runtime: {
          runtime_kind: "browser-mock",
          configured: true,
          workspace_initialized: true,
          runtime_running: true,
          base_url: "mock://runtime",
          port: 0
        }
      };
    },
    async initializeWorkspace() {
      return {
        root: "browser-mock-workspace",
        state_dir: "browser-mock-workspace/.dossier/state",
        artifacts_dir: "browser-mock-workspace/.dossier/artifacts"
      };
    },
    async ensureRuntime() {
      return {
        runtime_kind: "browser-mock",
        configured: true,
        workspace_initialized: true,
        runtime_running: true,
        base_url: "mock://runtime",
        port: 0
      };
    },
    async processFixture(fixture) {
      const result = buildMockResult(fixture);
      mockRuns.set(result.run.run_id, result);
      return result;
    },
    async listReviewTasks(runId) {
      const result = mockRuns.get(runId);
      if (!result) {
        throw new Error(`Mock run not found: ${runId}`);
      }
      return {
        review_tasks: result.review_tasks,
        revisions: result.revisions ?? [],
        approval_audit: result.approval_audit ?? []
      };
    },
    async applyFieldEdit(runId, fieldId, newValue, note) {
      const result = mockRuns.get(runId);
      if (!result) {
        throw new Error(`Mock run not found: ${runId}`);
      }

      const field = result.fields.find((item) => item.field_id === fieldId);
      if (!field) {
        throw new Error(`Mock field not found: ${fieldId}`);
      }

      const revisionId = `revision_${Date.now()}`;
      result.revisions = [
        ...(result.revisions ?? []),
        {
          revision_id: revisionId,
          run_id: runId,
          document_id: result.run.document_id,
          field_id: fieldId,
          source: "human_edit",
          author_type: "user",
          created_at: new Date().toISOString(),
          summary: `Updated ${field.label}`,
          before_value: field.normalized_value,
          after_value: newValue,
          note: note ?? null
        }
      ];
      result.approval_audit = [
        ...(result.approval_audit ?? []),
        {
          approval_id: `approval_${Date.now()}`,
          run_id: runId,
          review_task_id: result.review_tasks[0]?.review_task_id ?? null,
          action: "field_edited",
          actor: "browser-mock-user",
          created_at: new Date().toISOString(),
          note: note ?? null,
          revision_id: revisionId
        }
      ];
      field.human_approved_value = newValue;
      field.normalized_value = newValue;
      field.status = "approved";
      result.warnings = [];
      result.review_tasks = result.review_tasks.map((task) => ({ ...task, status: "resolved" }));
      mockRuns.set(runId, result);
      return result;
    },
    async approveRun(runId) {
      const result = mockRuns.get(runId);
      if (!result) {
        throw new Error(`Mock run not found: ${runId}`);
      }
      result.run.status = "approved";
      result.review_tasks = result.review_tasks.map((task) => ({ ...task, status: "approved" }));
      result.approval_audit = [
        ...(result.approval_audit ?? []),
        {
          approval_id: `approval_${Date.now()}`,
          run_id: runId,
          review_task_id: result.review_tasks[0]?.review_task_id ?? null,
          action: "approved",
          actor: "browser-mock-user",
          created_at: new Date().toISOString(),
          note: null,
          revision_id: null
        }
      ];
      return result;
    },
    async rejectRun(runId, note) {
      const result = mockRuns.get(runId);
      if (!result) {
        throw new Error(`Mock run not found: ${runId}`);
      }
      result.run.status = "failed";
      result.review_tasks = result.review_tasks.map((task) => ({ ...task, status: "rejected" }));
      result.approval_audit = [
        ...(result.approval_audit ?? []),
        {
          approval_id: `approval_${Date.now()}`,
          run_id: runId,
          review_task_id: result.review_tasks[0]?.review_task_id ?? null,
          action: "rejected",
          actor: "browser-mock-user",
          created_at: new Date().toISOString(),
          note: note ?? null,
          revision_id: null
        }
      ];
      return result;
    },
    async exportRun(runId, exportTarget) {
      const result = mockRuns.get(runId);
      if (!result) {
        throw new Error(`Mock run not found: ${runId}`);
      }
      result.run.status = "completed";
      return {
        artifact_ref: `artifact://mock/${runId}.${exportTarget === "connector" ? "txt" : exportTarget}`,
        run: result.run
      };
    }
  };
}

function createTauriGateway(): DesktopGateway {
  return {
    mode: "tauri-live",
    async getKernelStatus() {
      return invokeTauri<DesktopKernelStatus>("get_kernel_status");
    },
    async initializeWorkspace(workspaceRoot = "") {
      return invokeTauri<DesktopWorkspacePaths>("initialize_workspace", { workspaceRoot });
    },
    async ensureRuntime() {
      return invokeTauri<DesktopRuntimeStatus>("ensure_runtime");
    },
    async processFixture(fixture) {
      const created = await invokeTauri<{ payload: RuntimeRunRecord }>("create_run", {
        documentId: fixture.fixtureId,
        mode: fixture.mode,
        pipelineId: `${fixture.industry}_${fixture.mode}`,
        pipelineVersion: "0.1.0"
      });

      const executed = await invokeTauri<{ payload: RuntimeExecutionResult }>("execute_run", {
        runId: created.payload.run_id,
        documentId: fixture.fixtureId,
        fileName: fixture.fileName,
        sourceType: fixture.fileName.endsWith(".jpg") ? "image" : "pdf",
        pageCount: fixture.workspace.subtitle.includes("2 pages") ? 2 : 1,
        hasSchema: fixture.mode === "schema_workflow"
      });

      return executed.payload;
    },
    async listReviewTasks(runId) {
      const response = await invokeTauri<{
        payload: Pick<RuntimeExecutionResult, "review_tasks" | "revisions" | "approval_audit">;
      }>("list_review_tasks", { runId });
      return response.payload;
    },
    async applyFieldEdit(runId, fieldId, newValue, note) {
      const response = await invokeTauri<{ payload: RuntimeExecutionResult }>("apply_field_edit", {
        runId,
        fieldId,
        newValue,
        note
      });
      return response.payload;
    },
    async approveRun(runId) {
      const approved = await invokeTauri<{ payload: RuntimeExecutionResult }>("approve_run", { runId });
      return approved.payload;
    },
    async rejectRun(runId, note) {
      const rejected = await invokeTauri<{ payload: RuntimeExecutionResult }>("reject_run", { runId, note });
      return rejected.payload;
    },
    async exportRun(runId, exportTarget) {
      const exported = await invokeTauri<{ payload: { artifact_ref: string; run: RuntimeRunRecord } }>("export_run", {
        runId,
        exportTarget
      });
      return exported.payload;
    }
  };
}

export function createDesktopGateway(): DesktopGateway {
  return isTauriEnvironment() ? createTauriGateway() : createBrowserMockGateway();
}
