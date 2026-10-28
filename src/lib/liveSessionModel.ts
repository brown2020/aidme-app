import { z } from "zod";
import { MAX_LINE_LENGTH, MAX_SESSION_VIEWERS } from "@/lib/constants";

/** Firestore auto-IDs are 20 alphanumeric characters */
export const sessionIdSchema = z.string().regex(/^[A-Za-z0-9]{10,40}$/);

/**
 * Firestore field names. firestore.rules lists the same keys;
 * firestoreSchema.test.ts fails if the two drift apart.
 */
export const SESSION_FIELDS = [
  "ownerUid",
  "ownerName",
  "ownerEmail",
  "title",
  "status",
  "language",
  "createdAt",
  "updatedAt",
] as const;
export const LINE_FIELDS = ["text", "createdAt"] as const;
export const INTERIM_FIELDS = ["text", "seq", "updatedAt"] as const;
export const INVITE_FIELDS = ["emails", "emailKeys", "updatedAt"] as const;
export const MEMBER_FIELDS = ["emailKey", "uid"] as const;
export const INBOX_FIELDS = ["createdAt"] as const;
export const ACCOUNT_SESSION_FIELDS = ["emailKey", "createdAt"] as const;

/** Lowercase hex SHA-256, the id of a membership document */
export const EMAIL_KEY_PATTERN = /^[0-9a-f]{64}$/;

/** In-progress text rotates across this many documents to stay under per-document write limits */
export const INTERIM_SLOTS = 4;

export type LiveSessionStatus = "live" | "ended";

export interface LiveSession {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  status: LiveSessionStatus;
  language: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TranscriptLine {
  id: string;
  text: string;
  createdAt: Date | null;
}

const dateSchema = z.date().nullable();

export const liveSessionSchema = z.object({
  ownerUid: z.string().min(1),
  ownerName: z.string(),
  ownerEmail: z.string(),
  title: z.string(),
  status: z.enum(["live", "ended"]),
  language: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const transcriptLineSchema = z.object({
  text: z.string(),
  createdAt: dateSchema,
});

export const interimSchema = z.object({
  text: z.string(),
  seq: z.number().int().nonnegative(),
});

export const invitesSchema = z.object({
  emails: z.array(z.string()).max(MAX_SESSION_VIEWERS),
  emailKeys: z.array(z.string()).max(MAX_SESSION_VIEWERS).optional(),
});

/**
 * Pairs owner-only emails with the legacy session hash list.
 * Only hashes this client can recompute from those emails are kept.
 */
export function pairLegacyInvites(
  emails: string[],
  hashed: string[],
  legacyKeys: readonly string[]
): { emails: string[]; emailKeys: string[] } {
  const legacy = new Set(legacyKeys.filter((key) => EMAIL_KEY_PATTERN.test(key)));
  const pairedEmails: string[] = [];
  const pairedKeys: string[] = [];
  emails.forEach((email, index) => {
    const key = hashed[index];
    if (key && legacy.has(key)) {
      pairedEmails.push(email);
      pairedKeys.push(key);
    }
  });
  return { emails: pairedEmails, emailKeys: pairedKeys };
}

const emailSchema = z.email();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lowercase hex SHA-256 of the normalized email; must match firestore.rules' viewerKey() */
export async function emailKey(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeEmail(email));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function emailKeys(emails: string[]): Promise<string[]> {
  return Promise.all(emails.map(emailKey));
}

/** Picks the newest in-progress text among the rotating interim documents */
export function latestInterimText(docs: { text: string; seq: number }[]): string {
  let latest: { text: string; seq: number } | null = null;
  for (const doc of docs) if (!latest || doc.seq > latest.seq) latest = doc;
  return latest?.text ?? "";
}

export interface ParsedViewerEmails {
  emails: string[];
  invalid: string[];
  tooMany: boolean;
}

/** Splits a comma/space/newline separated list into unique, lowercase, valid emails */
export function parseViewerEmails(input: string, ownerEmail?: string | null): ParsedViewerEmails {
  const owner = ownerEmail ? normalizeEmail(ownerEmail) : null;
  const emails = new Set<string>();
  const invalid: string[] = [];
  for (const raw of input.split(/[\s,;]+/)) {
    if (!raw) continue;
    const email = normalizeEmail(raw);
    if (!emailSchema.safeParse(email).success) {
      invalid.push(raw);
      continue;
    }
    if (email !== owner) emails.add(email);
  }
  return { emails: [...emails], invalid, tooMany: emails.size > MAX_SESSION_VIEWERS };
}

/** Trims a recognized sentence to what firestore.rules accepts, or null if empty */
export function toLineText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_LINE_LENGTH);
}

export function buildShareUrl(origin: string, sessionId: string): string {
  return `${origin}/s/${sessionId}`;
}

export function buildShareMessage(ownerName: string, url: string): string {
  return `${ownerName} is sharing live captions with you on Aid.me.\n\nOpen this link and sign in with this email address to follow along:\n${url}`;
}

export function buildMailtoUrl(recipients: string[], subject: string, body: string): string {
  const to = recipients.map(encodeURIComponent).join(",");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function defaultSessionTitle(date: Date): string {
  return `Conversation · ${date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
