import type { Influencer, InfluencerStatus } from "../types";
import { INFLUENCER_STATUSES } from "../types";

interface Props {
  influencers: Influencer[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  statusFilter: InfluencerStatus | "";
  onStatusFilter: (v: InfluencerStatus | "") => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onAddClick: () => void;
}

const statusLabels: Record<InfluencerStatus, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  REPLIED: "Geantwortet",
  INTERESTED: "Interessiert",
  DECLINED: "Abgelehnt",
  CUSTOMER: "Kunde",
};

export function InfluencerList({
  influencers,
  loading,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  onSelect,
  selectedId,
  onAddClick,
}: Props) {
  return (
    <div className="influencer-list">
      <div className="list-toolbar">
        <input
          type="text"
          placeholder="Suche nach Name, Insta, E-Mail…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value as InfluencerStatus | "")}
        >
          <option value="">Alle Status</option>
          {INFLUENCER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <button className="primary" onClick={onAddClick}>
          + Neu
        </button>
      </div>

      {loading && <div className="empty-state">Lade…</div>}
      {!loading && influencers.length === 0 && (
        <div className="empty-state">Keine Influencer gefunden.</div>
      )}

      <ul>
        {influencers.map((inf) => (
          <li
            key={inf.id}
            className={inf.id === selectedId ? "selected" : ""}
            onClick={() => onSelect(inf.id)}
          >
            <span className="row-avatar">{inf.name.charAt(0).toUpperCase()}</span>
            <div className="row-body">
              <div className="row-main">
                <span className="name">{inf.name}</span>
                <span className={`badge badge-${inf.status.toLowerCase()}`}>
                  {statusLabels[inf.status]}
                </span>
              </div>
              <div className="row-sub">
                {inf.instagramHandle ? `@${inf.instagramHandle}` : inf.email ?? "—"}
                {inf.followerCount ? ` · ${inf.followerCount.toLocaleString("de-DE")} Follower` : ""}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { statusLabels };
