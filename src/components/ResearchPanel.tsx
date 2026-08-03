import { useEffect, useState } from "react";
import type { ApiClient } from "../api";
import type { ResearchHistoryEntry, ResearchSuggestion } from "../types";

interface Props {
  api: ApiClient;
  onInfluencerAdded: () => void;
}

export function ResearchPanel({ api, onInfluencerAdded }: Props) {
  const [niche, setNiche] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ResearchSuggestion[] | null>(null);
  const [addedHandles, setAddedHandles] = useState<Set<string>>(new Set());
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const [history, setHistory] = useState<ResearchHistoryEntry[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<ResearchHistoryEntry | null>(null);

  async function loadHistory() {
    try {
      const entries = await api.fetchResearchHistory();
      setHistory(entries);
    } catch {
      // Verlauf ist ein Zusatzfeature - Fehler hier blockieren nicht die recherche
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) {
      setError("Bitte eine Nische eingeben.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setViewingEntry(null);
    setAddedHandles(new Set());
    try {
      const result = await api.researchInfluencers({
        niche: niche.trim(),
        campaignGoal: campaignGoal.trim() || undefined,
        count: 5,
      });
      setSuggestions(result.suggestions);
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  function openHistoryEntry(entry: ResearchHistoryEntry) {
    setViewingEntry(entry);
    setSuggestions(entry.suggestions);
    setNiche(entry.niche);
    setAddedHandles(new Set());
    setError(null);
  }

  async function handleAdd(suggestion: ResearchSuggestion, key: string) {
    setAddingKey(key);
    setAddError(null);
    try {
      await api.createInfluencer({
        name: suggestion.name,
        instagramHandle: suggestion.instagramHandle ?? undefined,
        niche: niche.trim() || undefined,
        followerCount: suggestion.estimatedFollowers ?? undefined,
        notes: [suggestion.matchReason, suggestion.pitchAngle].filter(Boolean).join("\n\n"),
        source: "KI-Recherche",
      });
      setAddedHandles((prev) => new Set(prev).add(key));
      onInfluencerAdded();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Konnte nicht angelegt werden.");
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <div className="research-panel">
      <div className="research-intro">
        <h2>KI-Recherche</h2>
        <p>
          Nische oder Kampagnen-Idee eingeben – die KI schlägt 5 passende Influencer-Profile vor.
        </p>
      </div>

      <form className="research-form" onSubmit={handleSubmit}>
        <label>
          Nische *
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="z.B. veganes Fitness & Ernährung"
            autoFocus
          />
        </label>
        <label>
          Kampagnen-Ziel / Kontext (optional)
          <textarea
            value={campaignGoal}
            onChange={(e) => setCampaignGoal(e.target.value)}
            rows={2}
            placeholder="z.B. Produktlaunch neuer Protein-Riegel, Zielgruppe 20-35"
          />
        </label>
        <div className="research-form-actions">
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Suche läuft…" : "5 Influencer vorschlagen"}
          </button>
          {history && history.length > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              Verlauf ({history.length}) {historyOpen ? "▲" : "▼"}
            </button>
          )}
        </div>
      </form>

      {historyOpen && history && (
        <div className="research-history">
          {history.length === 0 && <div className="empty-state">Noch keine Recherchen archiviert.</div>}
          <ul className="research-history-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`research-history-item${viewingEntry?.id === entry.id ? " active" : ""}`}
                  onClick={() => openHistoryEntry(entry)}
                >
                  <span className="research-history-niche">{entry.niche}</span>
                  <span className="research-history-meta">
                    {new Date(entry.createdAt).toLocaleString("de-DE")} ·{" "}
                    {entry.suggestions.length} Vorschläge
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="error-text">{error}</div>}

      {loading && (
        <div className="research-loading">
          <span className="spinner" /> KI durchsucht passende Profile…
        </div>
      )}

      {viewingEntry && !loading && (
        <div className="research-disclaimer">
          Archivierte Recherche vom {new Date(viewingEntry.createdAt).toLocaleString("de-DE")}.
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <>
          {!viewingEntry && (
            <div className="research-disclaimer">
              KI-Recherche mit Live-Websuche – Angaben trotzdem vor Kontaktaufnahme manuell auf
              Instagram prüfen (Handle, Follower-Zahl, Aktivität).
            </div>
          )}
          {addError && <div className="error-text">{addError}</div>}
          <div className="research-results">
            {suggestions.map((s, i) => {
              const key = `${s.instagramHandle ?? s.name}-${i}`;
              const added = addedHandles.has(key);
              return (
                <div className="research-card" key={key}>
                  <div className="research-card-header">
                    <span className="research-card-name">{s.name}</span>
                    {s.instagramHandle && (
                      <span className="research-card-handle">@{s.instagramHandle}</span>
                    )}
                  </div>
                  {typeof s.estimatedFollowers === "number" && (
                    <div className="research-card-followers">
                      ~{s.estimatedFollowers.toLocaleString("de-DE")} Follower
                    </div>
                  )}
                  <div className="research-card-block">
                    <div className="research-card-label">Warum passend</div>
                    <p>{s.matchReason}</p>
                  </div>
                  <div className="research-card-block">
                    <div className="research-card-label">Vorschlag Ansatz</div>
                    <p>{s.pitchAngle}</p>
                  </div>
                  {s.sources && s.sources.length > 0 && (
                    <div className="research-card-block">
                      <div className="research-card-label">Quellen</div>
                      <ul className="research-card-sources">
                        {s.sources.map((url) => (
                          <li key={url}>
                            <a href={url} target="_blank" rel="noreferrer noopener">
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="research-card-actions">
                    <button
                      className="primary"
                      disabled={added || addingKey === key}
                      onClick={() => handleAdd(s, key)}
                    >
                      {added ? "✓ Hinzugefügt" : addingKey === key ? "Speichere…" : "Als Influencer anlegen"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {suggestions && suggestions.length === 0 && !loading && (
        <div className="empty-state">Keine Vorschläge erhalten.</div>
      )}
    </div>
  );
}
