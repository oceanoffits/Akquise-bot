import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    instagramHandle?: string;
    email?: string;
    niche?: string;
    followerCount?: number;
    notes?: string;
    source?: string;
  }) => Promise<void>;
}

export function AddInfluencerModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        instagramHandle: instagramHandle.trim() || undefined,
        email: email.trim() || undefined,
        niche: niche.trim() || undefined,
        followerCount: followerCount ? Number(followerCount) : undefined,
        notes: notes.trim() || undefined,
        source: source.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Neuen Influencer anlegen</h2>
        <label>
          Name *
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label>
          Instagram-Handle
          <input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
        </label>
        <label>
          E-Mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Nische
          <input value={niche} onChange={(e) => setNiche(e.target.value)} />
        </label>
        <label>
          Follower
          <input
            type="number"
            min={0}
            value={followerCount}
            onChange={(e) => setFollowerCount(e.target.value)}
          />
        </label>
        <label>
          Quelle
          <input value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <label>
          Notizen
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>

        {error && <div className="error-text">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Speichere…" : "Anlegen"}
          </button>
        </div>
      </form>
    </div>
  );
}
