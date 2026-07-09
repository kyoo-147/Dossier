import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SampleFixture } from "@dossier/sample-data";
import {
  createDesktopGateway,
  type DesktopDocumentRecord,
  type DesktopKernelStatus,
  type RuntimeApprovalAuditRecord,
  type RuntimeExecutionResult,
  type RuntimeRevisionRecord,
  type RuntimeReviewTaskRecord
} from "./desktopGateway.js";

interface FixtureSessionState {
  processing: boolean;
  result?: RuntimeExecutionResult;
  artifactRef?: string | undefined;
  error?: string | undefined;
  reviewTasks?: RuntimeReviewTaskRecord[];
  revisions?: RuntimeRevisionRecord[];
  approvalAudit?: RuntimeApprovalAuditRecord[];
}

interface RuntimeContextValue {
  mode: "browser-mock" | "tauri-live";
  kernelStatus: DesktopKernelStatus | null;
  booting: boolean;
  bootstrapError: string | null;
  documents: DesktopDocumentRecord[];
  sessions: Record<string, FixtureSessionState>;
  pickDocumentSource(): Promise<string | null>;
  registerDocument(input: {
    sourcePath: string;
    modeHint: string;
    pageCount: number;
    hasSchema: boolean;
  }): Promise<void>;
  processFixture(fixture: SampleFixture): Promise<void>;
  processDocument(document: DesktopDocumentRecord): Promise<void>;
  refreshReview(fixture: SampleFixture): Promise<void>;
  editField(fixture: SampleFixture, fieldId: string, newValue: string, note?: string): Promise<void>;
  approveAndExport(fixture: SampleFixture, exportTarget?: "json" | "markdown" | "connector"): Promise<void>;
  rejectRun(fixture: SampleFixture, note?: string): Promise<void>;
  refreshSessionReview(sessionKey: string): Promise<void>;
  editSessionField(sessionKey: string, fieldId: string, newValue: string, note?: string): Promise<void>;
  approveSessionAndExport(sessionKey: string, exportTarget?: "json" | "markdown" | "connector"): Promise<void>;
  rejectSessionRun(sessionKey: string, note?: string): Promise<void>;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

function patchSessionState(
  current: Record<string, FixtureSessionState>,
  fixtureId: string,
  patch: Partial<FixtureSessionState>
): Record<string, FixtureSessionState> {
  return {
    ...current,
    [fixtureId]: {
      ...(current[fixtureId] ?? { processing: false }),
      ...patch
    }
  };
}

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const gateway = useMemo(() => createDesktopGateway(), []);
  const [kernelStatus, setKernelStatus] = useState<DesktopKernelStatus | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DesktopDocumentRecord[]>([]);
  const [sessions, setSessions] = useState<Record<string, FixtureSessionState>>({});

  const updateSessionFromResult = useCallback(
    (sessionKey: string, result: RuntimeExecutionResult, artifactRef?: string) => {
      setSessions((current) =>
        patchSessionState(current, sessionKey, {
          processing: false,
          result,
          artifactRef,
          reviewTasks: result.review_tasks,
          revisions: result.revisions ?? [],
          approvalAudit: result.approval_audit ?? []
        })
      );
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await gateway.initializeWorkspace("");
        await gateway.ensureRuntime();
        const status = await gateway.getKernelStatus();
        const nextDocuments = await gateway.listDocuments();
        if (!cancelled) {
          setKernelStatus(status);
          setDocuments(nextDocuments);
        }
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [gateway]);

  const processFixture = useCallback(
    async (fixture: SampleFixture) => {
      setSessions((current) => patchSessionState(current, fixture.fixtureId, { processing: true, error: undefined }));
      try {
        const result = await gateway.processFixture(fixture);
        const status = await gateway.getKernelStatus();
        setKernelStatus(status);
        updateSessionFromResult(fixture.fixtureId, result);
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, fixture.fixtureId, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway, updateSessionFromResult]
  );

  const registerDocument = useCallback(
    async (input: { sourcePath: string; modeHint: string; pageCount: number; hasSchema: boolean }) => {
      const created = await gateway.registerDocument(input);
      const nextDocuments = await gateway.listDocuments();
      setDocuments(nextDocuments);
      setSessions((current) => patchSessionState(current, created.document_id, { processing: false }));
    },
    [gateway]
  );

  const pickDocumentSource = useCallback(async () => gateway.pickDocumentSource(), [gateway]);

  const processDocument = useCallback(
    async (document: DesktopDocumentRecord) => {
      setSessions((current) => patchSessionState(current, document.document_id, { processing: true, error: undefined }));
      try {
        const result = await gateway.processDocument(document);
        const status = await gateway.getKernelStatus();
        setKernelStatus(status);
        updateSessionFromResult(document.document_id, result);
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, document.document_id, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway, updateSessionFromResult]
  );

  const refreshSessionReview = useCallback(
    async (sessionKey: string) => {
      const session = sessions[sessionKey];
      const runId = session?.result?.run.run_id;
      if (!runId) {
        return;
      }

      const review = await gateway.listReviewTasks(runId);
      setSessions((current) =>
        patchSessionState(current, sessionKey, {
          reviewTasks: review.review_tasks,
          revisions: review.revisions ?? [],
          approvalAudit: review.approval_audit ?? []
        })
      );
    },
    [gateway, sessions]
  );

  const editSessionField = useCallback(
    async (sessionKey: string, fieldId: string, newValue: string, note?: string) => {
      const session = sessions[sessionKey];
      const runId = session?.result?.run.run_id;
      if (!runId) {
        throw new Error("Run has not been executed yet.");
      }

      setSessions((current) => patchSessionState(current, sessionKey, { processing: true, error: undefined }));
      try {
        const result = await gateway.applyFieldEdit(runId, fieldId, newValue, note);
        updateSessionFromResult(sessionKey, result);
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, sessionKey, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway, sessions, updateSessionFromResult]
  );

  const approveSessionAndExport = useCallback(
    async (sessionKey: string, exportTarget: "json" | "markdown" | "connector" = "json") => {
      const session = sessions[sessionKey];
      const runId = session?.result?.run.run_id;
      if (!runId) {
        throw new Error("Run has not been executed yet.");
      }

      setSessions((current) => patchSessionState(current, sessionKey, { processing: true, error: undefined }));
      try {
        const approved = await gateway.approveRun(runId);
        const exported = await gateway.exportRun(runId, exportTarget);
        updateSessionFromResult(sessionKey, approved, exported.artifact_ref);
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, sessionKey, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway, sessions, updateSessionFromResult]
  );

  const rejectSessionRun = useCallback(
    async (sessionKey: string, note?: string) => {
      const session = sessions[sessionKey];
      const runId = session?.result?.run.run_id;
      if (!runId) {
        throw new Error("Run has not been executed yet.");
      }

      setSessions((current) => patchSessionState(current, sessionKey, { processing: true, error: undefined }));
      try {
        const rejected = await gateway.rejectRun(runId, note);
        updateSessionFromResult(sessionKey, rejected);
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, sessionKey, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway, sessions, updateSessionFromResult]
  );

  const refreshReview = useCallback(
    async (fixture: SampleFixture) => refreshSessionReview(fixture.fixtureId),
    [refreshSessionReview]
  );

  const editField = useCallback(
    async (fixture: SampleFixture, fieldId: string, newValue: string, note?: string) =>
      editSessionField(fixture.fixtureId, fieldId, newValue, note),
    [editSessionField]
  );

  const approveAndExport = useCallback(
    async (fixture: SampleFixture, exportTarget: "json" | "markdown" | "connector" = "json") =>
      approveSessionAndExport(fixture.fixtureId, exportTarget),
    [approveSessionAndExport]
  );

  const rejectRun = useCallback(
    async (fixture: SampleFixture, note?: string) => rejectSessionRun(fixture.fixtureId, note),
    [rejectSessionRun]
  );

  return (
    <RuntimeContext.Provider
      value={{
        mode: gateway.mode,
        kernelStatus,
        booting,
        bootstrapError,
        documents,
        sessions,
        pickDocumentSource,
        registerDocument,
        processFixture,
        processDocument,
        refreshReview,
        editField,
        approveAndExport,
        rejectRun,
        refreshSessionReview,
        editSessionField,
        approveSessionAndExport,
        rejectSessionRun
      }}
    >
      {children}
    </RuntimeContext.Provider>
  );
}

export function useRuntimeContext(): RuntimeContextValue {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error("RuntimeContext is missing. Wrap the app with RuntimeProvider.");
  }
  return context;
}
