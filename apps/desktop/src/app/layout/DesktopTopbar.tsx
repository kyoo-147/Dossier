export function DesktopTopbar({ title, runtimeLabel, runtimeError }: { title: string; runtimeLabel: string; runtimeError: boolean }) {
  return (
    <header className="desktop-topbar">
      <div className="window-controls" aria-hidden="true">
        <span className="window-dot window-dot--red" />
        <span className="window-dot window-dot--amber" />
        <span className="window-dot window-dot--green" />
      </div>
      <button className="icon-button menu-button" aria-label="Toggle navigation"><span /><span /><span /></button>
      <div className="app-wordmark">Dossier</div>
      <div className="app-product-name">{title}</div>
      <div className={`runtime-state ${runtimeError ? "runtime-state--error" : ""}`}>
        <span className="runtime-dot" />
        {runtimeLabel}
      </div>
      <button className="help-button" aria-label="Help">?</button>
      <button className="avatar-button" aria-label="Account">AK</button>
    </header>
  );
}
