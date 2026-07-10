import type { ReactNode } from "react";

export interface WorkbenchShellProps {
  mainTabs?: ReactNode;
  mainContent: ReactNode;
  summaryContent?: ReactNode;
  actionPanel?: ReactNode;
}

export function WorkbenchShell({ mainTabs, mainContent, summaryContent, actionPanel }: WorkbenchShellProps) {
  return (
    <div className="workbench-layout">
      <div className="workbench-main">
        {mainTabs && <div className="panel-tabs">{mainTabs}</div>}
        {mainContent}
      </div>
      {summaryContent && <div className="issue-summary">{summaryContent}</div>}
      {actionPanel}
    </div>
  );
}
