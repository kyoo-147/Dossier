export function RiskPanel({ riskScore, riskSummary }: { riskScore: string; riskSummary: string[] }) {
  return <div className="risk-panel"><div className="panel-heading">Risk & Validation</div><div className="risk-panel__body"><div className="risk-score"><strong>{riskScore}</strong><small>Low Risk</small></div><div className="risk-list">{riskSummary.map((item) => <div key={item}><span />{item}</div>)}</div></div></div>;
}
