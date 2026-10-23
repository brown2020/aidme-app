import { z } from "zod";
import { MAX_LINE_LENGTH, MAX_SESSION_VIEWERS } from "@/lib/constants";

/** Firestore auto-IDs are 20 alphanumeric characters */
export const sessionIdSchema = z.string().regex(/^[A-Za-z0-9]{10,40}$/);

export type LiveSessionStatus = "live" | "ended";

export interface LiveSession {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  status: LiveSessionStatus;
  language: string;
  viewerEmails: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TranscriptLine {
  id: string;
  text: string;
  createdAt: Date | null;
}

const emailSchema = z.email();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

export function buildMailtoUrl(
  recipients: string[],
  subject: string,
  body: string
): string {
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
