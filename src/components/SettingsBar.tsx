interface Props {
  serverUrl: string;
  setServerUrl: (v: string) => void;
  token: string;
  setToken: (v: string) => void;
  status: "idle" | "checking" | "ok" | "error";
  onCheck: () => void;
}

export function SettingsBar({ serverUrl, setServerUrl, token, setToken, status, onCheck }: Props) {
  return (
    <div className="settings-bar">
      <input
        className="settings-input"
        type="text"
        placeholder="Server-URL (z.B. http://localhost:3000)"
        value={serverUrl}
        onChange={(e) => setServerUrl(e.target.value)}
      />
      <input
        className="settings-input"
        type="password"
        placeholder="API Bearer Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button onClick={onCheck} disabled={status === "checking"}>
        {status === "checking" ? "Prüfe…" : "Verbindung testen"}
      </button>
      <span className={`status-dot status-${status}`} title={status} />
    </div>
  );
}
