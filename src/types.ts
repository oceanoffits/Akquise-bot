export type InfluencerStatus =
  | "NEW"
  | "CONTACTED"
  | "REPLIED"
  | "INTERESTED"
  | "DECLINED"
  | "CUSTOMER";

export type MessageChannel = "EMAIL" | "INSTAGRAM";
export type MessageDirection = "OUTBOUND" | "INBOUND";
export type MessageStatus = "DRAFT" | "PENDING_APPROVAL" | "SENT" | "FAILED" | "REPLIED";

export interface Influencer {
  id: string;
  name: string;
  instagramHandle: string | null;
  email: string | null;
  niche: string | null;
  followerCount: number | null;
  status: InfluencerStatus;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  influencerId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  subject: string | null;
  body: string;
  status: MessageStatus;
  externalId: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerWithMessages extends Influencer {
  messages: Message[];
}

export const INFLUENCER_STATUSES: InfluencerStatus[] = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "DECLINED",
  "CUSTOMER",
];
