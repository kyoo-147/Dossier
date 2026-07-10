export interface WorkspaceFieldRow {
  fieldId: string;
  label: string;
  observedValue?: string | null;
  normalizedValue: string;
  humanApprovedValue?: string | null;
  status: "approved" | "warning" | "needs_review";
}

interface FieldTableProps { fields: WorkspaceFieldRow[]; selectedFieldId?: string | null; onSelectField?(fieldId: string): void; }

export function FieldTable({ fields, selectedFieldId, onSelectField }: FieldTableProps) {
  return <div className="field-table"><div className="field-table__heading">Extracted Fields</div><div className="field-table__rows">{fields.map((field) => <button key={field.fieldId} onClick={() => onSelectField?.(field.fieldId)} className={`field-row${field.fieldId === selectedFieldId ? " field-row--selected" : ""}`}><span className="field-row__copy"><span className="field-row__label">{field.label}</span><span className="field-row__value">{field.normalizedValue}</span><span className="field-row__evidence">Observed: {field.observedValue ?? "—"} · Approved: {field.humanApprovedValue ?? "—"}</span></span><span className={`field-status field-status--${field.status}`}>{field.status}</span></button>)}</div></div>;
}
