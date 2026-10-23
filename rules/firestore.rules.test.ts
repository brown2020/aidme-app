import { readFileSync } from "fs";
import { join } from "path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const OWNER = { uid: "owner", email: "owner@example.com" };
const VIEWER = { uid: "viewer", email: "viewer@example.com" };
const STRANGER = { uid: "stranger", email: "stranger@example.com" };
const SESSION_ID = "session1234567890abcd";

let env: RulesTestEnvironment;

function dbFor(user: { uid: string; email: string }, emailVerified = true): Firestore {
  return env
    .authenticatedContext(user.uid, { email: user.email, email_verified: emailVerified })
    .firestore() as unknown as Firestore;
}

function sessionData(overrides: Record<string, unknown> = {}) {
  return {
    ownerUid: OWNER.uid,
    ownerName: "Owner",
    ownerEmail: OWNER.email,
    title: "Conversation",
    status: "live",
    language: "en-US",
    viewerEmails: [VIEWER.email],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

async function seedSession(overrides: Record<string, unknown> = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "sessions", SESSION_ID), sessionData(overrides));
    await setDoc(doc(db, "sessions", SESSION_ID, "lines", "line1"), {
      text: "Hello there.",
      createdAt: serverTimestamp(),
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-aidme",
    firestore: { rules: readFileSync(join(__dirname, "../firestore.rules"), "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("session creation", () => {
  it("lets a verified user create their own live session", async () => {
    await assertSucceeds(addDoc(collection(dbFor(OWNER), "sessions"), sessionData()));
  });

  it("rejects an unverified email", async () => {
    await assertFails(addDoc(collection(dbFor(OWNER, false), "sessions"), sessionData()));
  });

  it("rejects signed-out writes", async () => {
    const db = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(addDoc(collection(db, "sessions"), sessionData()));
  });

  it("rejects creating a session owned by someone else", async () => {
    await assertFails(
      addDoc(collection(dbFor(STRANGER), "sessions"), sessionData({ ownerEmail: STRANGER.email }))
    );
  });

  it("rejects a forged owner email", async () => {
    await assertFails(
      addDoc(collection(dbFor(OWNER), "sessions"), sessionData({ ownerEmail: "ceo@example.com" }))
    );
  });

  it("rejects unexpected fields and too many viewers", async () => {
    const db = dbFor(OWNER);
    await assertFails(addDoc(collection(db, "sessions"), sessionData({ isAdmin: true })));
    const eleven = Array.from({ length: 11 }, (_, i) => `v${i}@example.com`);
    await assertFails(addDoc(collection(db, "sessions"), sessionData({ viewerEmails: eleven })));
  });
});

describe("session reads", () => {
  beforeEach(() => seedSession());

  it("allows the owner and an invited verified viewer", async () => {
    await assertSucceeds(getDoc(doc(dbFor(OWNER), "sessions", SESSION_ID)));
    await assertSucceeds(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID)));
  });

  it("matches the invited email case-insensitively", async () => {
    const db = dbFor({ uid: VIEWER.uid, email: "Viewer@Example.com" });
    await assertSucceeds(getDoc(doc(db, "sessions", SESSION_ID)));
  });

  it("denies an uninvited user, an unverified invitee, and signed-out visitors", async () => {
    await assertFails(getDoc(doc(dbFor(STRANGER), "sessions", SESSION_ID)));
    await assertFails(getDoc(doc(dbFor(VIEWER, false), "sessions", SESSION_ID)));
    const anon = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(getDoc(doc(anon, "sessions", SESSION_ID)));
  });

  it("allows the account-page list queries only for matching owner or invitee", async () => {
    await assertSucceeds(
      getDocs(query(collection(dbFor(OWNER), "sessions"), where("ownerUid", "==", OWNER.uid)))
    );
    await assertSucceeds(
      getDocs(
        query(collection(dbFor(VIEWER), "sessions"), where("viewerEmails", "array-contains", VIEWER.email))
      )
    );
    await assertFails(
      getDocs(query(collection(dbFor(STRANGER), "sessions"), where("ownerUid", "==", OWNER.uid)))
    );
    await assertFails(getDocs(collection(dbFor(STRANGER), "sessions")));
  });
});

describe("session updates and deletes", () => {
  beforeEach(() => seedSession());

  it("lets the owner end the session and change invitees", async () => {
    const ref = doc(dbFor(OWNER), "sessions", SESSION_ID);
    await assertSucceeds(updateDoc(ref, { status: "ended", updatedAt: serverTimestamp() }));
    await assertSucceeds(
      updateDoc(ref, { viewerEmails: ["new@example.com"], updatedAt: serverTimestamp() })
    );
  });

  it("lets a viewer remove only their own email", async () => {
    await seedSession({ viewerEmails: [VIEWER.email, "other@example.com"] });
    const ref = doc(dbFor(VIEWER), "sessions", SESSION_ID);
    await assertFails(
      updateDoc(ref, { viewerEmails: [VIEWER.email], updatedAt: serverTimestamp() })
    );
    await assertFails(
      updateDoc(ref, { viewerEmails: ["other@example.com"], status: "ended", updatedAt: serverTimestamp() })
    );
    await assertSucceeds(
      updateDoc(ref, { viewerEmails: arrayRemove(VIEWER.email), updatedAt: serverTimestamp() })
    );
  });

  it("blocks viewers from editing or deleting", async () => {
    const ref = doc(dbFor(VIEWER), "sessions", SESSION_ID);
    await assertFails(
      updateDoc(ref, { viewerEmails: [VIEWER.email, STRANGER.email], updatedAt: serverTimestamp() })
    );
    await assertFails(deleteDoc(ref));
  });

  it("blocks the owner from transferring ownership", async () => {
    await assertFails(
      updateDoc(doc(dbFor(OWNER), "sessions", SESSION_ID), {
        ownerUid: STRANGER.uid,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("lets the owner delete", async () => {
    await assertSucceeds(deleteDoc(doc(dbFor(OWNER), "sessions", SESSION_ID)));
  });
});

describe("transcript lines", () => {
  const line = () => ({ text: "How are you?", createdAt: serverTimestamp() });

  it("lets the owner append lines while live, and viewers read them", async () => {
    await seedSession();
    await assertSucceeds(addDoc(collection(dbFor(OWNER), "sessions", SESSION_ID, "lines"), line()));
    await assertSucceeds(getDocs(collection(dbFor(VIEWER), "sessions", SESSION_ID, "lines")));
  });

  it("denies line reads to uninvited users", async () => {
    await seedSession();
    await assertFails(getDocs(collection(dbFor(STRANGER), "sessions", SESSION_ID, "lines")));
  });

  it("blocks writes from viewers and after the session ends", async () => {
    await seedSession();
    await assertFails(addDoc(collection(dbFor(VIEWER), "sessions", SESSION_ID, "lines"), line()));
    await seedSession({ status: "ended" });
    await assertFails(addDoc(collection(dbFor(OWNER), "sessions", SESSION_ID, "lines"), line()));
  });

  it("keeps lines append-only and well-formed", async () => {
    await seedSession();
    const db = dbFor(OWNER);
    await assertFails(
      updateDoc(doc(db, "sessions", SESSION_ID, "lines", "line1"), { text: "Edited." })
    );
    const lines = collection(db, "sessions", SESSION_ID, "lines");
    await assertFails(addDoc(lines, { text: "", createdAt: serverTimestamp() }));
    await assertFails(addDoc(lines, { text: "x".repeat(2001), createdAt: serverTimestamp() }));
    await assertFails(addDoc(lines, { ...line(), speaker: "someone" }));
  });

  it("lets the owner stream in-progress text that viewers can read", async () => {
    await seedSession();
    const ownerRef = doc(dbFor(OWNER), "sessions", SESSION_ID, "interim", "current");
    await assertSucceeds(setDoc(ownerRef, { text: "how are", updatedAt: serverTimestamp() }));
    await assertSucceeds(setDoc(ownerRef, { text: "how are you", updatedAt: serverTimestamp() }));
    await assertSucceeds(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID, "interim", "current")));
    await assertFails(getDoc(doc(dbFor(STRANGER), "sessions", SESSION_ID, "interim", "current")));
  });

  it("restricts in-progress text to the owner, one document, while live", async () => {
    await seedSession();
    const interim = (db: Firestore, id = "current") => doc(db, "sessions", SESSION_ID, "interim", id);
    await assertFails(setDoc(interim(dbFor(VIEWER)), { text: "spoof", updatedAt: serverTimestamp() }));
    await assertFails(setDoc(interim(dbFor(OWNER), "other"), { text: "x", updatedAt: serverTimestamp() }));
    await assertFails(
      setDoc(interim(dbFor(OWNER)), { text: "x", updatedAt: serverTimestamp(), extra: true })
    );
    await seedSession({ status: "ended" });
    await assertFails(setDoc(interim(dbFor(OWNER)), { text: "late", updatedAt: serverTimestamp() }));
  });

  it("stops viewer access once the owner removes them", async () => {
    await seedSession({ viewerEmails: ["someone-else@example.com"] });
    await assertFails(getDocs(collection(dbFor(VIEWER), "sessions", SESSION_ID, "lines")));
  });
});
