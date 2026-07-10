import type { ReactNode } from "react";

export interface DocumentRailShellProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function DocumentRailShell({ header, children, footer }: DocumentRailShellProps) {
  return (
    <div className="rail-layout">
      {header && <header className="rail-header">{header}</header>}
      {children}
      {footer && <footer className="rail-footer">{footer}</footer>}
    </div>
  );
}
