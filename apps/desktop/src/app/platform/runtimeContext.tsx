import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SampleFixture } from "@dossier/sample-data";
import { createDesktopGateway, type DesktopKernelStatus, type RuntimeExecutionResult } from "./desktopGateway.js";

interface FixtureSessionState {
  processing: boolean;
  result?: RuntimeExecutionResult;
  artifactRef?: string | undefined;
  error?: string | undefined;
}

interface RuntimeContextValue {
  mode: "browser-mock" | "tauri-live";
  kernelStatus: DesktopKernelStatus | null;
  booting: boolean;
  bootstrapError: string | null;
  sessions: Record<string, FixtureSessionState>;
  processFixture(fixture: SampleFixture): Promise<void>;
  approveAndExport(fixture: SampleFixture, exportTarget?: "json" | "markdown" | "connector"): Promise<void>;
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
  const [sessions, setSessions] = useState<Record<string, FixtureSessionState>>({});

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await gateway.initializeWorkspace("");
        await gateway.ensureRuntime();
        const status = await gateway.getKernelStatus();
        if (!cancelled) {
          setKernelStatus(status);
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
        setSessions((current) => patchSessionState(current, fixture.fixtureId, { processing: false, result }));
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, fixture.fixtureId, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway]
  );

  const approveAndExport = useCallback(
    async (fixture: SampleFixture, exportTarget: "json" | "markdown" | "connector" = "json") => {
      const session = sessions[fixture.fixtureId];
      const runId = session?.result?.run.run_id;
      if (!runId) {
        throw new Error("Run has not been executed yet.");
      }

      setSessions((current) => patchSessionState(current, fixture.fixtureId, { processing: true, error: undefined }));
      try {
        const approved = await gateway.approveRun(runId);
        const exported = await gateway.exportRun(runId, exportTarget);
        setSessions((current) =>
          patchSessionState(current, fixture.fixtureId, {
            processing: false,
            result: approved,
            artifactRef: exported.artifact_ref
          })
        );
      } catch (error) {
        setSessions((current) =>
          patchSessionState(current, fixture.fixtureId, {
            processing: false,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    },
    [gateway, sessions]
  );

  return (
    <RuntimeContext.Provider
      value={{
        mode: gateway.mode,
        kernelStatus,
        booting,
        bootstrapError,
        sessions,
        processFixture,
        approveAndExport
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
