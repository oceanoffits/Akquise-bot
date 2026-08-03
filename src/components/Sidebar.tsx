import type { AppTab } from "../types";

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  influencerCount: number;
}

const TABS: { key: AppTab; label: string; icon: string; hint: string }[] = [
  { key: "influencers", label: "Influencer", icon: "👥", hint: "Übersicht & Nachrichten" },
  { key: "research", label: "Recherche", icon: "✨", hint: "KI schlägt Influencer vor" },
];

export function Sidebar({ active, onChange, influencerCount }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">🌊</span>
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">Ocean Office</span>
          <span className="sidebar-brand-sub">Akquise-Bot</span>
        </span>
      </div>

      <div className="sidebar-group-label">Workflow</div>
      <ul className="sidebar-tabs">
        {TABS.map((tab) => (
          <li key={tab.key}>
            <button
              type="button"
              className={`sidebar-tab ${active === tab.key ? "active" : ""}`}
              onClick={() => onChange(tab.key)}
            >
              <span className="sidebar-tab-icon">{tab.icon}</span>
              <span className="sidebar-tab-text">
                <span className="sidebar-tab-label">{tab.label}</span>
                <span className="sidebar-tab-hint">{tab.hint}</span>
              </span>
              {tab.key === "influencers" && influencerCount > 0 && (
                <span className="sidebar-tab-count">{influencerCount}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
