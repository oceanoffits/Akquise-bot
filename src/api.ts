import type {
  Influencer,
  InfluencerStatus,
  InfluencerWithMessages,
  Message,
  MessageChannel,
  MessageStatus,
} from "./types";

export class ApiError extends Error {
  statusCode: number;
  body: string;

  constructor(statusCode: number, body: string) {
    super(`Server-Fehler (${statusCode}): ${body}`);
    this.statusCode = statusCode;
    this.body = body;
  }
}

export class ApiClient {
  private serverUrl: string;
  private token: string;

  constructor(serverUrl: string, token: string) {
    this.serverUrl = serverUrl;
    this.token = token;
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const url = `${this.serverUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new ApiError(res.status, text);
    }
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  fetchInfluencers(params: { status?: InfluencerStatus; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return this.request<Influencer[]>(`influencers${qs ? `?${qs}` : ""}`, "GET");
  }

  fetchInfluencer(id: string) {
    return this.request<InfluencerWithMessages>(`influencers/${id}`, "GET");
  }

  createInfluencer(payload: {
    name: string;
    instagramHandle?: string;
    email?: string;
    niche?: string;
    followerCount?: number;
    notes?: string;
    source?: string;
  }) {
    return this.request<Influencer>("influencers", "POST", payload);
  }

  updateInfluencer(id: string, payload: Partial<Influencer>) {
    return this.request<Influencer>(`influencers/${id}`, "PATCH", payload);
  }

  fetchMessages(params: { channel?: MessageChannel; status?: MessageStatus } = {}) {
    const query = new URLSearchParams();
    if (params.channel) query.set("channel", params.channel);
    if (params.status) query.set("status", params.status);
    const qs = query.toString();
    return this.request<(Message & { influencer: Influencer })[]>(
      `messages${qs ? `?${qs}` : ""}`,
      "GET"
    );
  }

  generateDraft(influencerId: string, channel: MessageChannel, templateId?: string) {
    return this.request<Message>(`influencers/${influencerId}/draft`, "POST", {
      channel,
      templateId,
    });
  }

  updateMessage(id: string, payload: { subject?: string; body?: string }) {
    return this.request<Message>(`messages/${id}`, "PATCH", payload);
  }

  sendMessage(id: string) {
    return this.request<Message>(`messages/${id}/send`, "POST");
  }

  markMessageSent(id: string) {
    return this.request<Message>(`messages/${id}/mark-sent`, "POST");
  }

  markMessageReplied(id: string, replyBody?: string) {
    return this.request<Influencer>(`messages/${id}/mark-replied`, "POST", { replyBody });
  }

  health() {
    return this.request<{ ok: boolean }>("health", "GET");
  }
}
