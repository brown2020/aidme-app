import { expect, type Page } from "@playwright/test";

const PROJECT = "demo-aidme";
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = "http://127.0.0.1:8086";
const API_KEY = "demo-api-key";
const ADMIN = { Authorization: "Bearer owner", "Content-Type": "application/json" };

declare global {
  interface Window {
    __speak: (text: string, isFinal: boolean) => void;
  }
}

/** Replaces the microphone and Web Speech API with a scriptable fake */
export async function useFakeSpeech(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const stream = { getTracks: () => [{ stop() {} }] };
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => stream },
      configurable: true,
    });
    const registry: { current: FakeRecognition | null } = { current: null };
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      running = false;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      constructor() {
        registry.current = this;
      }
      start() {
        this.running = true;
        setTimeout(() => this.onstart?.(), 0);
      }
      stop() {
        if (!this.running) return;
        this.running = false;
        setTimeout(() => this.onend?.(), 0);
      }
      abort() {
        this.stop();
      }
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition, webkitSpeechRecognition: FakeRecognition });
    window.__speak = (text: string, isFinal: boolean) => {
      const result = Object.assign([{ transcript: text, confidence: 1 }], { isFinal });
      registry.current?.onresult?.({ resultIndex: 0, results: [result] });
    };
  });
}

export async function resetEmulators(): Promise<void> {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, {
    method: "DELETE",
  });
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
  uid: string;
}

/** Creates an email/password user whose email is already verified */
export async function createVerifiedUser(name: string, email: string): Promise<TestUser> {
  const password = "correct-horse-battery";
  const signUp = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const { localId } = (await signUp.json()) as { localId: string };
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
    method: "POST",
    headers: ADMIN,
    body: JSON.stringify({ localId, emailVerified: true, displayName: name }),
  });
  return { email, password, name, uid: localId };
}

export async function signIn(page: Page, user: TestUser, redirect = "/"): Promise<void> {
  await page.goto(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === redirect.split("?")[0]);
}

interface OobCode {
  email: string;
  oobLink: string;
  requestType: "VERIFY_EMAIL" | "PASSWORD_RESET" | "EMAIL_SIGNIN";
}

/** The newest email the Auth emulator "sent" to this address of the given type */
export async function latestEmail(email: string, requestType: OobCode["requestType"]): Promise<OobCode> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
    const { oobCodes } = (await res.json()) as { oobCodes: OobCode[] };
    const match = oobCodes.filter((c) => c.email === email && c.requestType === requestType).pop();
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No ${requestType} email for ${email}`);
}

/** Reads a document straight from the Firestore emulator, bypassing rules */
export async function readDoc(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`,
    { headers: ADMIN }
  );
  if (res.status === 404) return null;
  return ((await res.json()) as { fields: Record<string, unknown> }).fields;
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
