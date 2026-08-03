import { useState } from "react";
import type { ApiClient } from "../api";
import type { InfluencerWithMessages, InfluencerStatus, MessageChannel } from "../types";
import { INFLUENCER_STATUSES } from "../types";
import { statusLabels } from "./InfluencerList";

interface Props {
  api: ApiClient;
  influencer: InfluencerWithMessages;
  onChanged: () => void;
}

export function InfluencerDetail({ api, influencer, onChanged }: Props) {
  const [draftingChannel, setDraftingChannel] = useState<MessageChannel | null>(null);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { subject: string; body: string }>>({});

  async function withBusy(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    }
  }

  async function handleGenerateDraft(channel: MessageChannel) {
    setDraftingChannel(channel);
    await withBusy(async () => {
      await api.generateDraft(influencer.id, channel);
      onChanged();
    });
    setDraftingChannel(null);
  }

  async function handleStatusChange(status: InfluencerStatus) {
    await withBusy(async () => {
      await api.updateInfluencer(influencer.id, { status });
      onChanged();
    });
  }

  function editFor(messageId: string, subject: string | null, body: string) {
    return edits[messageId] ?? { subject: subject ?? "", body };
  }

  async function handleSaveEdit(messageId: string) {
    const edit = edits[messageId];
    if (!edit) return;
    setBusyMessageId(messageId);
    await withBusy(async () => {
      await api.updateMessage(messageId, { subject: edit.subject, body: edit.body });
      onChanged();
    });
    setBusyMessageId(null);
  }

  async function handleSendMessage(messageId: string) {
    setBusyMessageId(messageId);
    await withBusy(async () => {
      await api.sendMessage(messageId);
      onChanged();
    });
    setBusyMessageId(null);
  }

  async function handleMarkSent(messageId: string) {
    setBusyMessageId(messageId);
    await withBusy(async () => {
      await api.markMessageSent(messageId);
      onChanged();
    });
    setBusyMessageId(null);
  }

  async function handleMarkReplied(messageId: string) {
    const replyBody = window.prompt("Antworttext (optional):") ?? undefined;
    setBusyMessageId(messageId);
    await withBusy(async () => {
      await api.markMessageReplied(messageId, replyBody || undefined);
      onChanged();
    });
    setBusyMessageId(null);
  }

  return (
    <div className="influencer-detail">
      <div className="detail-header">
        <h2>{influencer.name}</h2>
        <select
          value={influencer.status}
          onChange={(e) => handleStatusChange(e.target.value as InfluencerStatus)}
        >
          {INFLUENCER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <dl className="detail-meta">
        {influencer.instagramHandle && (
          <>
            <dt>Instagram</dt>
            <dd>@{influencer.instagramHandle}</dd>
          </>
        )}
        {influencer.instagramUserId && (
          <>
            <dt>Instagram User ID</dt>
            <dd>{influencer.instagramUserId}</dd>
          </>
        )}
        {influencer.email && (
          <>
            <dt>E-Mail</dt>
            <dd>{influencer.email}</dd>
          </>
        )}
        {influencer.niche && (
          <>
            <dt>Nische</dt>
            <dd>{influencer.niche}</dd>
          </>
        )}
        {influencer.followerCount != null && (
          <>
            <dt>Follower</dt>
            <dd>{influencer.followerCount.toLocaleString("de-DE")}</dd>
          </>
        )}
        {influencer.notes && (
          <>
            <dt>Notizen</dt>
            <dd>{influencer.notes}</dd>
          </>
        )}
      </dl>

      {error && <div className="error-text">{error}</div>}

      <div className="draft-actions">
        <button
          disabled={!influencer.email || draftingChannel === "EMAIL"}
          onClick={() => handleGenerateDraft("EMAIL")}
          title={!influencer.email ? "Keine E-Mail hinterlegt" : ""}
        >
          {draftingChannel === "EMAIL" ? "Generiere…" : "E-Mail-Entwurf generieren"}
        </button>
        <button
          disabled={!influencer.instagramHandle || draftingChannel === "INSTAGRAM"}
          onClick={() => handleGenerateDraft("INSTAGRAM")}
          title={!influencer.instagramHandle ? "Kein Instagram-Handle hinterlegt" : ""}
        >
          {draftingChannel === "INSTAGRAM" ? "Generiere…" : "Instagram-DM-Entwurf generieren"}
        </button>
      </div>

      <h3>Nachrichten</h3>
      {influencer.messages.length === 0 && (
        <div className="empty-state">Noch keine Nachrichten.</div>
      )}
      <ul className="message-list">
        {influencer.messages.map((m) => {
          const isBusy = busyMessageId === m.id;
          const editable = m.direction === "OUTBOUND" && m.status === "DRAFT";
          const edit = editFor(m.id, m.subject, m.body);
          return (
            <li key={m.id} className={`message-item direction-${m.direction.toLowerCase()}`}>
              <div className="message-meta">
                <span className="channel">{m.channel}</span>
                <span className={`badge badge-msg-${m.status.toLowerCase()}`}>{m.status}</span>
                <span className="direction">{m.direction === "OUTBOUND" ? "→ raus" : "← rein"}</span>
              </div>
              {editable ? (
                <>
                  {m.channel === "EMAIL" && (
                    <input
                      className="message-subject-input"
                      value={edit.subject}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [m.id]: { ...edit, subject: e.target.value },
                        }))
                      }
                    />
                  )}
                  <textarea
                    className="message-body-input"
                    rows={4}
                    value={edit.body}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [m.id]: { ...edit, body: e.target.value } }))
                    }
                  />
                  <div className="message-actions">
                    <button disabled={isBusy} onClick={() => handleSaveEdit(m.id)}>
                      Speichern
                    </button>
                    {m.channel === "EMAIL" ? (
                      <button
                        className="primary"
                        disabled={isBusy}
                        onClick={() => handleSendMessage(m.id)}
                      >
                        Per E-Mail senden
                      </button>
                    ) : (
                      <button
                        className="primary"
                        disabled={isBusy || !influencer.instagramUserId}
                        title={!influencer.instagramUserId ? "Instagram User ID nicht hinterlegt" : ""}
                        onClick={() => handleSendMessage(m.id)}
                      >
                        Instagram DM senden
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {m.subject && <div className="message-subject">{m.subject}</div>}
                  <div className="message-body">{m.body}</div>
                  {m.direction === "OUTBOUND" && m.status === "SENT" && (
                    <div className="message-actions">
                      <button disabled={isBusy} onClick={() => handleMarkReplied(m.id)}>
                        Antwort erfassen
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
