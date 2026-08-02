import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { ApiClient } from "./api";
import { useSettings } from "./useSettings";
import { SettingsBar } from "./components/SettingsBar";
import { InfluencerList } from "./components/InfluencerList";
import { InfluencerDetail } from "./components/InfluencerDetail";
import { AddInfluencerModal } from "./components/AddInfluencerModal";
import type { Influencer, InfluencerStatus, InfluencerWithMessages } from "./types";

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

  const configured = serverUrl.trim() !== "" && token.trim() !== "";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ocean Office · Akquise-Bot</h1>
        <SettingsBar
          serverUrl={serverUrl}
          setServerUrl={setServerUrl}
          token={token}
          setToken={setToken}
          status={connectionStatus}
          onCheck={checkConnection}
        />
      </header>

      {!configured && (
        <div className="empty-state main-empty">
          Bitte Server-URL und API-Token oben eintragen.
        </div>
      )}

      {configured && connectionStatus === "error" && (
        <div className="error-banner">
          Verbindung zum Server fehlgeschlagen. Läuft der Server? Stimmt die URL / der Token?
        </div>
      )}

      {configured && (
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
      )}

      {showAddModal && (
        <AddInfluencerModal
          onClose={() => setShowAddModal(false)}
          onCreate={async (payload) => {
            const created = await api.createInfluencer(payload);
            await loadInfluencers();
            setSelectedId(created.id);
          }}
        />
      )}
    </div>
  );
}

export default App;
