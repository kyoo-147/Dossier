import type { ReactNode } from "react";

export interface StandardPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  headerContent?: ReactNode;
  wide?: boolean;
  className?: string;
}

export function StandardPageShell({ title, description, children, headerContent, wide, className = "" }: StandardPageShellProps) {
  return (
    <div className={`standard-page${wide ? " standard-page--wide" : ""}${className ? ` ${className}` : ""}`}>
      <header className="standard-page__header">

        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {headerContent}
      </header>
      {children}
    </div>
  );
}
