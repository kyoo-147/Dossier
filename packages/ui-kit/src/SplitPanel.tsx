import type { PropsWithChildren } from "react";

export function SplitPanel({ children }: PropsWithChildren) {
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#f9fafb" }}>
      {children}
    </div>
  );
}
