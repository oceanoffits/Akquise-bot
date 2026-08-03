interface Props {
  serverUrl: string;
  setServerUrl: (v: string) => void;
  status: "idle" | "checking" | "ok" | "error";
  onCheck: () => void;
  onLogout: () => void;
}

export function SettingsBar({ serverUrl, setServerUrl, status, onCheck, onLogout }: Props) {
  return (
    <div className="settings-popover">
      <div className="settings-popover-title">Verbindung</div>
      <label className="settings-field">
        Server-URL
        <input
          type="text"
          placeholder="z.B. http://localhost:3000"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <div className="settings-popover-actions">
        <span className={`status-dot status-${status}`} title={status} />
        <button onClick={onCheck} disabled={status === "checking"}>
          {status === "checking" ? "Prüfe…" : "Verbindung testen"}
        </button>
      </div>
      <button type="button" className="settings-logout" onClick={onLogout}>
        Abmelden
      </button>
    </div>
  );
}
