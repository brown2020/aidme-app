import { createHash } from "crypto";
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
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const OWNER = { uid: "owner", email: "owner@example.com" };
const VIEWER = { uid: "viewer", email: "viewer@example.com" };
const STRANGER = { uid: "stranger", email: "stranger@example.com" };
const SESSION_ID = "session1234567890abcd";

/** Same algorithm as emailKey() in src/lib/liveSessionModel.ts */
const keyOf = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

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
    viewerKeys: [keyOf(VIEWER.email)],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

async function seedSession(overrides: Record<string, unknown> = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "sessions", SESSION_ID), sessionData(overrides));
    await setDoc(doc(db, "sessions", SESSION_ID, "private", "invites"), {
      emails: [VIEWER.email],
      updatedAt: serverTimestamp(),
    });
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
  it("lets a verified user create a session and its private invites in one batch", async () => {
    const db = dbFor(OWNER);
    const batch = writeBatch(db);
    const ref = doc(collection(db, "sessions"));
    batch.set(ref, sessionData());
    batch.set(doc(db, "sessions", ref.id, "private", "invites"), {
      emails: [VIEWER.email],
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it("rejects an unverified email and signed-out writes", async () => {
    await assertFails(addDoc(collection(dbFor(OWNER, false), "sessions"), sessionData()));
    const anon = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(addDoc(collection(anon, "sessions"), sessionData()));
  });

  it("rejects a session owned by someone else or a forged owner email", async () => {
    await assertFails(
      addDoc(collection(dbFor(STRANGER), "sessions"), sessionData({ ownerEmail: STRANGER.email }))
    );
    await assertFails(
      addDoc(collection(dbFor(OWNER), "sessions"), sessionData({ ownerEmail: "ceo@example.com" }))
    );
  });

  it("rejects unexpected fields, plain-email invite lists, and too many viewers", async () => {
    const db = dbFor(OWNER);
    await assertFails(addDoc(collection(db, "sessions"), sessionData({ isAdmin: true })));
    await assertFails(addDoc(collection(db, "sessions"), sessionData({ viewerEmails: [VIEWER.email] })));
    const eleven = Array.from({ length: 11 }, (_, i) => keyOf(`v${i}@example.com`));
    await assertFails(addDoc(collection(db, "sessions"), sessionData({ viewerKeys: eleven })));
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

  it("keeps invited emails owner-only", async () => {
    await assertSucceeds(getDoc(doc(dbFor(OWNER), "sessions", SESSION_ID, "private", "invites")));
    await assertFails(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID, "private", "invites")));
    await assertFails(
      setDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID, "private", "invites"), {
        emails: [],
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("allows the account-page list queries only for matching owner or invitee", async () => {
    await assertSucceeds(
      getDocs(query(collection(dbFor(OWNER), "sessions"), where("ownerUid", "==", OWNER.uid)))
    );
    await assertSucceeds(
      getDocs(
        query(collection(dbFor(VIEWER), "sessions"), where("viewerKeys", "array-contains", keyOf(VIEWER.email)))
      )
    );
    await assertFails(
      getDocs(
        query(collection(dbFor(STRANGER), "sessions"), where("viewerKeys", "array-contains", keyOf(VIEWER.email)))
      )
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
      updateDoc(ref, { viewerKeys: [keyOf("new@example.com")], updatedAt: serverTimestamp() })
    );
  });

  it("lets a viewer remove only their own fingerprint", async () => {
    await seedSession({ viewerKeys: [keyOf(VIEWER.email), keyOf("other@example.com")] });
    const ref = doc(dbFor(VIEWER), "sessions", SESSION_ID);
    await assertFails(
      updateDoc(ref, { viewerKeys: [keyOf(VIEWER.email)], updatedAt: serverTimestamp() })
    );
    await assertFails(
      updateDoc(ref, {
        viewerKeys: [keyOf("other@example.com")],
        status: "ended",
        updatedAt: serverTimestamp(),
      })
    );
    await assertSucceeds(
      updateDoc(ref, { viewerKeys: arrayRemove(keyOf(VIEWER.email)), updatedAt: serverTimestamp() })
    );
  });

  it("blocks viewers from adding people or deleting", async () => {
    const ref = doc(dbFor(VIEWER), "sessions", SESSION_ID);
    await assertFails(
      updateDoc(ref, {
        viewerKeys: [keyOf(VIEWER.email), keyOf(STRANGER.email)],
        updatedAt: serverTimestamp(),
      })
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
    await assertSucceeds(deleteDoc(doc(dbFor(OWNER), "sessions", SESSION_ID, "private", "invites")));
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

  it("lets the owner stream in-progress text across four slots that viewers can read", async () => {
    await seedSession();
    const owner = dbFor(OWNER);
    for (const slot of ["0", "1", "2", "3"]) {
      await assertSucceeds(
        setDoc(doc(owner, "sessions", SESSION_ID, "interim", slot), {
          text: `words ${slot}`,
          seq: Number(slot) + 1,
          updatedAt: serverTimestamp(),
        })
      );
    }
    await assertSucceeds(getDocs(collection(dbFor(VIEWER), "sessions", SESSION_ID, "interim")));
    await assertFails(getDocs(collection(dbFor(STRANGER), "sessions", SESSION_ID, "interim")));
  });

  it("restricts in-progress text to the owner, valid slots, and live sessions", async () => {
    await seedSession();
    const interim = (db: Firestore, slot = "0") => doc(db, "sessions", SESSION_ID, "interim", slot);
    const ok = { text: "x", seq: 1, updatedAt: serverTimestamp() };
    await assertFails(setDoc(interim(dbFor(VIEWER)), ok));
    await assertFails(setDoc(interim(dbFor(OWNER), "4"), ok));
    await assertFails(setDoc(interim(dbFor(OWNER)), { ...ok, seq: "1" }));
    await assertFails(setDoc(interim(dbFor(OWNER)), { ...ok, extra: true }));
    await seedSession({ status: "ended" });
    await assertFails(setDoc(interim(dbFor(OWNER)), ok));
  });

  it("stops viewer access once the owner removes them", async () => {
    await seedSession({ viewerKeys: [keyOf("someone-else@example.com")] });
    await assertFails(getDocs(collection(dbFor(VIEWER), "sessions", SESSION_ID, "lines")));
  });
});
