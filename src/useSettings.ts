import { useEffect, useState } from "react";

const SERVER_URL_KEY = "akquise.serverUrl";
const TOKEN_KEY = "akquise.apiToken";

export function useSettings() {
  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem(SERVER_URL_KEY) ?? "http://localhost:3000"
  );
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");

  useEffect(() => {
    localStorage.setItem(SERVER_URL_KEY, serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    localStorage.setItem(TOKEN_KEY, token);
  }, [token]);

  return {
    serverUrl,
    setServerUrl,
    token,
    setToken,
    isConfigured: serverUrl.trim() !== "" && token.trim() !== "",
  };
}
