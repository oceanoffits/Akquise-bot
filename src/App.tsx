import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { ApiClient } from "./api";
import { useSettings } from "./useSettings";
import { SettingsBar } from "./components/SettingsBar";
import { LoginPage } from "./components/LoginPage";
import { Sidebar } from "./components/Sidebar";
import { InfluencerList } from "./components/InfluencerList";
import { InfluencerStats } from "./components/InfluencerStats";
import { InfluencerDetail } from "./components/InfluencerDetail";
import { AddInfluencerModal } from "./components/AddInfluencerModal";
import { ResearchPanel } from "./components/ResearchPanel";
import type { AppTab, Influencer, InfluencerStatus, InfluencerWithMessages } from "./types";

const TAB_LABELS: Record<AppTab, string> = {
  influencers: "Influencer",
  research: "KI-Recherche",
};

function App() {
  const { serverUrl, setServerUrl, token, setToken } = useSettings();
  const api = useMemo(() => new ApiClient(serverUrl, token), [serverUrl, token]);

  const [connectionStatus, setConnectionStatus] = useState<"idle" | "checking" | "ok" | "error">(
    "idle"
  );
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InfluencerStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<InfluencerWithMessages | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("influencers");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const checkConnection = useCallback(async () => {
    setConnectionStatus("checking");
    try {
      await api.health();
      setConnectionStatus("ok");
    } catch {
      setConnectionStatus("error");
    }
  }, [api]);

  const loadInfluencers = useCallback(async () => {
    if (!serverUrl || !token) return;
    setLoadingList(true);
    setListError(null);
    try {
      const data = await api.fetchInfluencers({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setInfluencers(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Laden fehlgeschlagen.");
    } finally {
      setLoadingList(false);
    }
  }, [api, serverUrl, token, statusFilter, search]);

  const loadSelected = useCallback(async () => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    try {
      const data = await api.fetchInfluencer(selectedId);
      setSelected(data);
    } catch {
      setSelected(null);
    }
  }, [api, selectedId]);

  useEffect(() => {
    if (serverUrl && token) checkConnection();
  }, [serverUrl, token, checkConnection]);

  useEffect(() => {
    const timeout = setTimeout(loadInfluencers, 250);
    return () => clearTimeout(timeout);
  }, [loadInfluencers]);

  useEffect(() => {
    loadSelected();
  }, [loadSelected]);

  useEffect(() => {
    if (!settingsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  if (!token.trim()) {
    return <LoginPage serverUrl={serverUrl} onLoggedIn={setToken} />;
  }

  const configured = serverUrl.trim() !== "" && token.trim() !== "";

  return (
    <div className="app-shell">
      {configured && (
        <Sidebar active={activeTab} onChange={setActiveTab} influencerCount={influencers.length} />
      )}
      <div className="app">
        <header className="app-header">
          <div className="app-breadcrumb">
            <span className="app-breadcrumb-root">Ocean Office</span>
            <span className="app-breadcrumb-sep">›</span>
            <span className="app-breadcrumb-current">{TAB_LABELS[activeTab]}</span>
          </div>

          <div className="app-header-actions" ref={settingsRef}>
            <span
              className={`connection-pill status-${connectionStatus}`}
              title={`Verbindung: ${connectionStatus}`}
            >
              <span className={`status-dot status-${connectionStatus}`} />
              {connectionStatus === "ok" && "Verbunden"}
              {connectionStatus === "error" && "Getrennt"}
              {connectionStatus === "checking" && "Prüfe…"}
              {connectionStatus === "idle" && "Nicht verbunden"}
            </span>
            <button
              type="button"
              className="settings-toggle"
              onClick={() => setSettingsOpen((v) => !v)}
              title="Verbindungseinstellungen"
            >
              ⚙︎
            </button>
            {settingsOpen && (
              <SettingsBar
                serverUrl={serverUrl}
                setServerUrl={setServerUrl}
                status={connectionStatus}
                onCheck={checkConnection}
                onLogout={() => setToken("")}
              />
            )}
          </div>
        </header>

        {configured && connectionStatus === "error" && (
          <div className="error-banner">
            Verbindung zum Server fehlgeschlagen. Läuft der Server? Stimmt die URL / der Token?
          </div>
        )}

        {configured && activeTab === "influencers" && (
          <>
            <InfluencerStats influencers={influencers} />
            <main className="app-main">
              <InfluencerList
                influencers={influencers}
                loading={loadingList}
                search={search}
                onSearch={setSearch}
                statusFilter={statusFilter}
                onStatusFilter={setStatusFilter}
                onSelect={setSelectedId}
                selectedId={selectedId}
                onAddClick={() => setShowAddModal(true)}
              />
              <section className="detail-pane">
                {listError && <div className="error-text">{listError}</div>}
                {selected ? (
                  <InfluencerDetail
                    api={api}
                    influencer={selected}
                    onChanged={() => {
                      loadSelected();
                      loadInfluencers();
                    }}
                  />
                ) : (
                  <div className="empty-state">Wähle links einen Influencer aus.</div>
                )}
              </section>
            </main>
          </>
        )}

        {configured && activeTab === "research" && (
          <main className="app-main app-main-single">
            <ResearchPanel api={api} onInfluencerAdded={loadInfluencers} />
          </main>
        )}

        {showAddModal && (
          <AddInfluencerModal
            onClose={() => setShowAddModal(false)}
            onCreate={async (payload) => {
              const created = await api.createInfluencer(payload);
              await loadInfluencers();
              setSelectedId(created.id);
              setActiveTab("influencers");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
