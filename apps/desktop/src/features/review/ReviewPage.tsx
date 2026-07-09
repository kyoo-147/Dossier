import { ReviewInspector } from "./ReviewInspector.js";
import { sampleWorkspaceData } from "../workspace/sampleWorkspaceData.js";

export function ReviewPage() {
  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Review queue and approval actions.</div>
      <ReviewInspector warnings={sampleWorkspaceData.warnings} />
    </div>
  );
}
