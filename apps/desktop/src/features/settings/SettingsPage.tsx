const groups = [
  { title: "Runtime & execution", description: "Control how Dossier runs pipelines on this device.", rows: [["Execution mode", "Local-first"], ["Worker concurrency", "4 workers"], ["Runtime health checks", "Enabled"]] },
  { title: "Providers & adapters", description: "Swap OCR, layout, vision and LLM providers without changing workflows.", rows: [["OCR provider", "PaddleOCR baseline"], ["Agent provider", "Configurable"], ["Layout provider", "Built-in baseline"]] },
  { title: "Review policy", description: "Set the approval boundary for actions with business impact.", rows: [["Human approval", "Required for consequential actions"], ["Low-confidence fields", "Send to review"], ["Straight-through processing", "Policy controlled"]] },
  { title: "Export defaults", description: "Choose the artifact formats generated after approval.", rows: [["Primary format", "JSON"], ["Evidence manifest", "Included"], ["Default location", "Local workspace"]] }
] as const;

export function SettingsPage() {
  return <div className="standard-page settings-page"><header className="standard-page__header"><div><span className="eyebrow">System configuration</span><h1>Settings</h1><p>Configure the local runtime, provider adapters, review rules and export behavior.</p></div><button className="button button--primary">Save changes</button></header><div className="settings-list">{groups.map((group) => <section className="settings-section" key={group.title}><div className="settings-section__intro"><h2>{group.title}</h2><p>{group.description}</p></div><div className="settings-section__rows">{group.rows.map(([label, value]) => <button className="settings-row" key={label}><span>{label}</span><strong>{value}</strong><span className="settings-chevron">›</span></button>)}</div></section>)}</div></div>;
}
