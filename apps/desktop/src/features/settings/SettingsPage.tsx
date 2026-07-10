import { useState } from "react";
import { StandardPageShell } from "../../app/layout/StandardPageShell.js";

export function SettingsPage() {
  const [concurrency, setConcurrency] = useState("4");
  const [storagePath, setStoragePath] = useState("~/.dossier/storage");
  const [network, setNetwork] = useState("Local-first");

  return (
    <StandardPageShell
      title="Settings"
      description="Configure the local runtime, provider adapters, review rules and export behavior."
      headerContent={<button className="button button--primary" onClick={() => alert("Settings saved")}>Save changes</button>}
      className="settings-page"
    >
      <div className="settings-list">
        <section className="settings-section">
          <div className="settings-section__intro">
            <h2>Runtime & execution</h2>
            <p>Control how Dossier runs pipelines on this device.</p>
          </div>
          <div className="settings-section__rows">
            <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'default' }}>
              <span>Execution mode / Network</span>
              <select className="input" value={network} onChange={(e) => setNetwork(e.target.value)} style={{ marginTop: '8px' }}>
                <option value="Local-first">Local-first</option>
                <option value="Cloud-only">Cloud-only</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'default' }}>
              <span>System-wide concurrency</span>
              <input type="number" className="input" value={concurrency} onChange={(e) => setConcurrency(e.target.value)} style={{ marginTop: '8px' }} />
            </div>
            <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'default' }}>
              <span>Storage path</span>
              <input type="text" className="input" value={storagePath} onChange={(e) => setStoragePath(e.target.value)} style={{ marginTop: '8px', width: '100%' }} />
            </div>
          </div>
        </section>
        
        <section className="settings-section">
          <div className="settings-section__intro">
            <h2>Review policy</h2>
            <p>Set the approval boundary for actions with business impact.</p>
          </div>
          <div className="settings-section__rows">
             <button className="settings-row"><span>Human approval</span><strong>Required for consequential actions</strong><span className="settings-chevron">›</span></button>
             <button className="settings-row"><span>Low-confidence fields</span><strong>Send to review</strong><span className="settings-chevron">›</span></button>
             <button className="settings-row"><span>Straight-through processing</span><strong>Policy controlled</strong><span className="settings-chevron">›</span></button>
          </div>
        </section>
      </div>
    </StandardPageShell>
  );
}
