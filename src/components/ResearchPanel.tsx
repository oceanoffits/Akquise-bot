import { useState } from "react";
import type { ApiClient } from "../api";
import type { ResearchSuggestion } from "../types";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) {
      setError("Bitte eine Nische eingeben.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setAddedHandles(new Set());
    try {
      const result = await api.researchInfluencers({
        niche: niche.trim(),
        campaignGoal: campaignGoal.trim() || undefined,
        count: 5,
      });
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
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
        </div>
      </form>

      {error && <div className="error-text">{error}</div>}

      {loading && (
        <div className="research-loading">
          <span className="spinner" /> KI durchsucht passende Profile…
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <>
          <div className="research-disclaimer">
            KI-generierte Vorschläge basierend auf Trainingswissen (keine Live-Websuche) – Angaben
            vor Kontaktaufnahme prüfen.
          </div>
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
