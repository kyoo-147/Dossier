import type { SampleFixture } from "@dossier/sample-data";

export interface DesktopRuntimeStatus {
  runtime_kind: string;
  configured: boolean;
  workspace_initialized: boolean;
  runtime_running: boolean;
  base_url: string;
  port: number;
  auth_required: boolean;
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

export interface DesktopDocumentRecord {
  document_id: string;
  file_name: string;
  source_path: string;
  source_type: string;
  artifact_ref: string;
  artifact_sha256: string;
  artifact_size: number;
  page_count: number;
  has_schema: boolean;
  mode_hint: string;
  status: string;
  created_at: string;
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

export interface RuntimeSourceSummary {
  artifact_ref?: string | null;
  artifact_sha256?: string | null;
  text_extraction?: {
    status: "provided" | "extracted" | "unsupported_no_text_layer" | "unsupported_source_type" | "artifact_missing" | "ocr_adapter_missing" | "not_requested";
    adapter: string;
    characters: number;
  };
}

export interface RuntimeProgressEvent {
  sequence: number;
  type: string;
  event_type: string;
  status?: string | null;
  trace_id: string;
  run_id: string | null;
  document_id: string | null;
  emitted_at: string;
  payload: Record<string, unknown>;
}

export interface RuntimeExecutionResult {
  run: RuntimeRunRecord;
  source?: RuntimeSourceSummary;
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
  pickDocumentSource(): Promise<string | null>;
  listDocuments(): Promise<DesktopDocumentRecord[]>;
  registerDocument(input: {
    sourcePath: string;
    modeHint: string;
    pageCount: number;
    hasSchema: boolean;
  }): Promise<DesktopDocumentRecord>;
  processFixture(fixture: SampleFixture): Promise<RuntimeExecutionResult>;
  processDocument(document: DesktopDocumentRecord): Promise<RuntimeExecutionResult>;
  listRunEvents(runId: string, after?: number): Promise<{ events: RuntimeProgressEvent[]; next_sequence: number }>;
  cancelRun(runId: string, reason?: string): Promise<{ run: RuntimeRunRecord; canceled: boolean }>;
  listReviewTasks(runId: string): Promise<Pick<RuntimeExecutionResult, "review_tasks" | "revisions" | "approval_audit">>;
  applyFieldEdit(runId: string, fieldId: string, newValue: string, note?: string): Promise<RuntimeExecutionResult>;
  approveRun(runId: string): Promise<RuntimeExecutionResult>;
  rejectRun(runId: string, note?: string): Promise<RuntimeExecutionResult>;
  exportRun(runId: string, exportTarget: "json" | "markdown" | "connector"): Promise<{ artifact_ref: string; run: RuntimeRunRecord }>;
  pickSaveExportPath(suggestedName: string): Promise<string | null>;
  saveArtifactToPath(artifactRef: string, destinationPath: string): Promise<{ saved_path: string }>;
  revealPathInFolder(path: string): Promise<void>;
}

const mockRuns = new Map<string, RuntimeExecutionResult>();
const mockDocuments = new Map<string, DesktopDocumentRecord>();

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
    source: {
      artifact_ref: `artifact://mock/${fixture.fileName}`,
      artifact_sha256: "mock-sha256",
      text_extraction: { status: "provided", adapter: "fixture", characters: fixture.workspace.fields.length }
    },
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
          port: 0,
          auth_required: false
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
        port: 0,
        auth_required: false
      };
    },
    async pickDocumentSource() {
      return "D:\\docs\\picked-demo.pdf";
    },
    async listDocuments() {
      return Array.from(mockDocuments.values());
    },
    async registerDocument(input) {
      const fileName = input.sourcePath.split(/[\\/]/).pop() ?? input.sourcePath;
      const record: DesktopDocumentRecord = {
        document_id: `local_${Date.now()}`,
        file_name: fileName,
        source_path: input.sourcePath,
        source_type: fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
        artifact_ref: `artifact://mock/${fileName}`,
        artifact_sha256: "mock-sha256",
        artifact_size: 0,
        page_count: input.pageCount,
        has_schema: input.hasSchema,
        mode_hint: input.modeHint,
        status: "ready",
        created_at: new Date().toISOString()
      };
      mockDocuments.set(record.document_id, record);
      return record;
    },
    async processFixture(fixture) {
      const result = buildMockResult(fixture);
      mockRuns.set(result.run.run_id, result);
      return result;
    },
    async processDocument(document) {
      const fallbackWarnings = document.has_schema ? ["Approval required before export"] : [];
      const result: RuntimeExecutionResult = {
        run: {
          run_id: `mock_${document.document_id}`,
          document_id: document.document_id,
          mode: document.mode_hint,
          pipeline_id: `local_${document.mode_hint}`,
          pipeline_version: "0.1.0",
          status: document.has_schema ? "needs_review" : "completed",
          trace_id: `trace_${document.document_id}`,
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString()
        },
        fields: [
          {
            field_id: "mock_local_title",
            label: "Document Title",
            normalized_value: document.file_name,
            observed_value: document.file_name,
            human_approved_value: null,
            status: document.has_schema ? "warning" : "approved",
            warning_codes: document.has_schema ? ["APPROVAL_REQUIRED"] : []
          }
        ],
        warnings: fallbackWarnings.map((message) => ({ code: "APPROVAL_REQUIRED", message, severity: "medium" })),
        review_tasks: document.has_schema
          ? [
              {
                review_task_id: `review_${document.document_id}`,
                reason_codes: ["APPROVAL_REQUIRED"],
                status: "open",
                priority: "medium",
                required_action: "approval"
              }
            ]
          : [],
        revisions: [],
        approval_audit: []
      };
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
    async listRunEvents(runId, after = 0) {
      const result = mockRuns.get(runId);
      const event: RuntimeProgressEvent = {
        sequence: after + 1,
        type: "run.mock_replayed",
        event_type: "run.mock_replayed",
        status: result?.run.status ?? "missing",
        trace_id: result?.run.trace_id ?? "mock_trace",
        run_id: runId,
        document_id: result?.run.document_id ?? null,
        emitted_at: new Date().toISOString(),
        payload: { source: "browser-mock" }
      };
      return { events: [event], next_sequence: event.sequence };
    },
    async cancelRun(runId, reason) {
      const result = mockRuns.get(runId);
      if (!result) throw new Error(`Mock run not found: ${runId}`);
      result.run.status = "canceled";
      result.approval_audit = [
        ...(result.approval_audit ?? []),
        {
          approval_id: `approval_${Date.now()}`,
          run_id: runId,
          review_task_id: result.review_tasks[0]?.review_task_id ?? null,
          action: "canceled",
          actor: "browser-mock-user",
          created_at: new Date().toISOString(),
          note: reason ?? null,
          revision_id: null
        }
      ];
      return { run: result.run, canceled: true };
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
    },
    async pickSaveExportPath(suggestedName) {
      return `D:\\Exports\\${suggestedName}`;
    },
    async saveArtifactToPath(_artifactRef, destinationPath) {
      return { saved_path: destinationPath };
    },
    async revealPathInFolder(_path) {
      return;
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
      return invokeTauri<DesktopWorkspacePaths>("initialize_workspace", { workspace_root: workspaceRoot });
    },
    async ensureRuntime() {
      return invokeTauri<DesktopRuntimeStatus>("ensure_runtime");
    },
    async pickDocumentSource() {
      const dialog = await import("@tauri-apps/plugin-dialog");
      const selection = await dialog.open({
        title: "Select document",
        multiple: false,
        directory: false,
        filters: [
          {
            name: "Documents",
            extensions: ["pdf", "png", "jpg", "jpeg", "tif", "tiff", "bmp", "webp"]
          }
        ]
      });

      return typeof selection === "string" ? selection : null;
    },
    async listDocuments() {
      const response = await invokeTauri<{ documents: DesktopDocumentRecord[] }>("list_documents");
      return response.documents;
    },
    async registerDocument(input) {
      return invokeTauri<DesktopDocumentRecord>("register_document", {
        source_path: input.sourcePath,
        mode_hint: input.modeHint,
        page_count: input.pageCount,
        has_schema: input.hasSchema
      });
    },
    async processFixture(fixture) {
      const created = await invokeTauri<{ payload: RuntimeRunRecord }>("create_run", {
        document_id: fixture.fixtureId,
        mode: fixture.mode,
        pipeline_id: `${fixture.industry}_${fixture.mode}`,
        pipeline_version: "0.1.0"
      });

      const executed = await invokeTauri<{ payload: RuntimeExecutionResult }>("execute_run", {
        run_id: created.payload.run_id,
        document_id: fixture.fixtureId,
        file_name: fixture.fileName,
        source_type: fixture.fileName.endsWith(".jpg") ? "image" : "pdf",
        artifact_ref: null,
        page_count: fixture.workspace.subtitle.includes("2 pages") ? 2 : 1,
        has_schema: fixture.mode === "schema_workflow"
      });

      return executed.payload;
    },
    async processDocument(document) {
      const created = await invokeTauri<{ payload: RuntimeRunRecord }>("create_run", {
        document_id: document.document_id,
        mode: document.mode_hint,
        pipeline_id: `local_${document.mode_hint}`,
        pipeline_version: "0.1.0"
      });

      const executed = await invokeTauri<{ payload: RuntimeExecutionResult }>("execute_run", {
        run_id: created.payload.run_id,
        document_id: document.document_id,
        file_name: document.file_name,
        source_type: document.source_type,
        artifact_ref: document.artifact_ref,
        page_count: document.page_count,
        has_schema: document.has_schema
      });

      return executed.payload;
    },
    async listReviewTasks(runId) {
      const response = await invokeTauri<{
        payload: Pick<RuntimeExecutionResult, "review_tasks" | "revisions" | "approval_audit">;
      }>("list_review_tasks", { run_id: runId });
      return response.payload;
    },
    async listRunEvents(runId, after = 0) {
      const response = await invokeTauri<{ payload: { events: RuntimeProgressEvent[]; next_sequence: number } }>("list_run_events", {
        run_id: runId,
        after
      });
      return response.payload;
    },
    async cancelRun(runId, reason) {
      const response = await invokeTauri<{ payload: { run: RuntimeRunRecord; canceled: boolean } }>("cancel_run", {
        run_id: runId,
        reason
      });
      return response.payload;
    },
    async applyFieldEdit(runId, fieldId, newValue, note) {
      const response = await invokeTauri<{ payload: RuntimeExecutionResult }>("apply_field_edit", {
        run_id: runId,
        field_id: fieldId,
        new_value: newValue,
        note
      });
      return response.payload;
    },
    async approveRun(runId) {
      const approved = await invokeTauri<{ payload: RuntimeExecutionResult }>("approve_run", { run_id: runId });
      return approved.payload;
    },
    async rejectRun(runId, note) {
      const rejected = await invokeTauri<{ payload: RuntimeExecutionResult }>("reject_run", { run_id: runId, note });
      return rejected.payload;
    },
    async exportRun(runId, exportTarget) {
      const exported = await invokeTauri<{ payload: { artifact_ref: string; run: RuntimeRunRecord } }>("export_run", {
        run_id: runId,
        export_target: exportTarget
      });
      return exported.payload;
    },
    async pickSaveExportPath(suggestedName) {
      const dialog = await import("@tauri-apps/plugin-dialog");
      const selection = await dialog.save({
        title: "Save exported artifact",
        defaultPath: suggestedName
      });

      return typeof selection === "string" ? selection : null;
    },
    async saveArtifactToPath(artifactRef, destinationPath) {
      return invokeTauri<{ saved_path: string }>("save_artifact_to_path", {
        artifact_ref: artifactRef,
        destination_path: destinationPath
      });
    },
    async revealPathInFolder(path) {
      const opener = await import("@tauri-apps/plugin-opener");
      await opener.revealItemInDir(path);
    }
  };
}

export function createDesktopGateway(): DesktopGateway {
  return isTauriEnvironment() ? createTauriGateway() : createBrowserMockGateway();
}
