import type { ReactNode } from "react";

export interface WorkstationShellProps {
  documentRail: ReactNode;
  viewer: ReactNode;
  inspector: ReactNode;
  workbench: ReactNode;
}

export function WorkstationShell({ documentRail, viewer, inspector, workbench }: WorkstationShellProps) {
  return (
    <div className="workstation-layout" aria-label="Document workstation">
      <aside className="document-rail" data-testid="document-rail">{documentRail}</aside>
      <section className="document-viewer" data-testid="document-viewer">{viewer}</section>
      <aside className="document-inspector" data-testid="document-inspector">{inspector}</aside>
      <section className="workbench" data-testid="workbench">{workbench}</section>
    </div>
  );
}
