import type { ReactNode } from "react";

export interface DocumentViewerShellProps {
  toolbar?: ReactNode;
  children: ReactNode;
  modes?: ReactNode;
}

export function DocumentViewerShell({ toolbar, children, modes }: DocumentViewerShellProps) {
  return (
    <div className="viewer-layout">
      {toolbar && <div className="viewer-toolbar">{toolbar}</div>}
      <div className="canvas-stage">{children}</div>
      {modes && <div className="viewer-modes">{modes}</div>}
    </div>
  );
}
