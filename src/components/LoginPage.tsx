import { useState } from "react";
import { ApiError, login } from "../api";

interface Props {
  serverUrl: string;
  onLoggedIn: (token: string) => void;
}

export function LoginPage({ serverUrl, onLoggedIn }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = await login(serverUrl, password.trim());
      onLoggedIn(token);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError("Falsches Passwort.");
      } else if (err instanceof ApiError && err.statusCode === 503) {
        setError("Login ist serverseitig noch nicht konfiguriert (APP_LOGIN_PASSWORD fehlt).");
      } else {
        setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="login-brand-mark">🌊</span>
          <div>
            <div className="login-brand-name">Ocean Office</div>
            <div className="login-brand-sub">Akquise-Bot</div>
          </div>
        </div>

        <label className="login-field">
          Passwort
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort eingeben"
            autoFocus
          />
        </label>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" className="primary" disabled={loading || !password.trim()}>
          {loading ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
