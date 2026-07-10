import type { ReactNode } from "react";

export interface DocumentInspectorShellProps {
  tabs?: ReactNode;
  children: ReactNode;
}

export function DocumentInspectorShell({ tabs, children }: DocumentInspectorShellProps) {
  return (
    <div className="inspector-layout">
      {tabs && <div className="panel-tabs">{tabs}</div>}
      <div className="inspector-scroll">{children}</div>
    </div>
  );
}
