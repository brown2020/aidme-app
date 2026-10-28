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
  collection,
  deleteDoc,
  deleteField,
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
const OTHER = { uid: "other", email: "other@example.com" };
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

/** Rules-disabled seed of a session plus unclaimed membership for each email. */
async function seedSession(options: { status?: string; emails?: string[]; legacy?: boolean; lines?: number } = {}) {
  const emails = options.emails ?? [VIEWER.email];
  const lineCount = options.lines ?? 1;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const data = sessionData({ status: options.status ?? "live" });
    if (options.legacy) Object.assign(data, { viewerKeys: emails.map(keyOf) });
    await setDoc(doc(db, "sessions", SESSION_ID), data);
    await setDoc(doc(db, "sessions", SESSION_ID, "private", "invites"), {
      emails,
      emailKeys: emails.map(keyOf),
      updatedAt: serverTimestamp(),
    });
    if (!options.legacy) {
      for (const email of emails) {
        const key = keyOf(email);
        await setDoc(doc(db, "sessions", SESSION_ID, "members", key), { emailKey: key, uid: "" });
        await setDoc(doc(db, "inboxes", key, "sessions", SESSION_ID), { createdAt: serverTimestamp() });
      }
    }
    for (let i = 0; i < lineCount; i++) {
      await setDoc(doc(db, "sessions", SESSION_ID, "lines", `line${i}`), {
        text: `Hello ${i}.`,
        createdAt: serverTimestamp(),
      });
    }
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
  it("lets a verified user create a session, invites, members, and inboxes in one batch", async () => {
    const db = dbFor(OWNER);
    const batch = writeBatch(db);
    const ref = doc(collection(db, "sessions"));
    const key = keyOf(VIEWER.email);
    batch.set(ref, sessionData());
    batch.set(doc(db, "sessions", ref.id, "private", "invites"), {
      emails: [VIEWER.email],
      emailKeys: [key],
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, "sessions", ref.id, "members", key), { emailKey: key, uid: "" });
    batch.set(doc(db, "inboxes", key, "sessions", ref.id), { createdAt: serverTimestamp() });
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

  it("rejects unexpected fields and invite lists that are not short emails", async () => {
    const db = dbFor(OWNER);
    await assertFails(addDoc(collection(db, "sessions"), sessionData({ isAdmin: true })));
    const key = keyOf(VIEWER.email);
    const tooLong = `${"a".repeat(310)}@example.com`;
    const badInvites = async (emails: string[], keys: string[]) => {
      const batch = writeBatch(db);
      const ref = doc(collection(db, "sessions"));
      batch.set(ref, sessionData());
      batch.set(doc(db, "sessions", ref.id, "private", "invites"), {
        emails,
        emailKeys: keys,
        updatedAt: serverTimestamp(),
      });
      await assertFails(batch.commit());
    };
    await badInvites([VIEWER.email, "not-an-email"], [key, key]);
    await badInvites([tooLong], [key]);
    await badInvites(
      Array.from({ length: 11 }, (_, i) => `v${i}@example.com`),
      Array.from({ length: 11 }, (_, i) => keyOf(`v${i}@example.com`))
    );
    const batch = writeBatch(db);
    const ref = doc(collection(db, "sessions"));
    batch.set(ref, sessionData());
    batch.set(doc(db, "sessions", ref.id, "private", "invites"), {
      emails: [VIEWER.email],
      emailKeys: [key],
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, "sessions", ref.id, "members", "not-a-key"), { emailKey: "not-a-key", uid: "" });
    await assertFails(batch.commit());
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

  it("keeps invited emails and other people's fingerprints owner-only", async () => {
    await seedSession({ emails: [VIEWER.email, OTHER.email] });
    await assertSucceeds(getDoc(doc(dbFor(OWNER), "sessions", SESSION_ID, "private", "invites")));
    await assertFails(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID, "private", "invites")));
    await assertSucceeds(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID, "members", keyOf(VIEWER.email))));
    await assertFails(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID, "members", keyOf(OTHER.email))));
    await assertFails(getDocs(collection(dbFor(VIEWER), "sessions", SESSION_ID, "members")));
    await assertSucceeds(getDocs(collection(dbFor(OWNER), "sessions", SESSION_ID, "members")));
    const stored = await assertSucceeds(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID)));
    expectNoViewerKeys(stored);
  });

  it("allows the owner to list their sessions and denies a collection scan", async () => {
    await assertSucceeds(
      getDocs(query(collection(dbFor(OWNER), "sessions"), where("ownerUid", "==", OWNER.uid)))
    );
    await assertFails(
      getDocs(
        query(collection(dbFor(VIEWER), "sessions"), where("viewerKeys", "array-contains", keyOf(VIEWER.email)))
      )
    );
    await assertFails(getDocs(collection(dbFor(STRANGER), "sessions")));
    await assertSucceeds(getDocs(collection(dbFor(VIEWER), "inboxes", keyOf(VIEWER.email), "sessions")));
  });
});

describe("claim and leave", () => {
  beforeEach(() => seedSession({ emails: [VIEWER.email, OTHER.email] }));

  it("binds the invite to the uid and stops a later mailbox owner from reading it", async () => {
    const db = dbFor(VIEWER);
    const key = keyOf(VIEWER.email);
    const batch = writeBatch(db);
    batch.update(doc(db, "sessions", SESSION_ID, "members", key), { uid: VIEWER.uid });
    batch.set(doc(db, "accounts", VIEWER.uid, "sessions", SESSION_ID), {
      emailKey: key,
      createdAt: serverTimestamp(),
    });
    batch.delete(doc(db, "inboxes", key, "sessions", SESSION_ID));
    await assertSucceeds(batch.commit());

    const impostor = dbFor({ uid: "later-owner", email: VIEWER.email });
    await assertFails(getDoc(doc(impostor, "sessions", SESSION_ID)));

    const moved = dbFor({ uid: VIEWER.uid, email: "moved@example.com" });
    await assertSucceeds(getDoc(doc(moved, "sessions", SESSION_ID)));
    await assertFails(getDoc(doc(moved, "sessions", SESSION_ID, "members", keyOf(OTHER.email))));
  });

  it("lets the invited person delete their own unclaimed membership", async () => {
    const db = dbFor(VIEWER);
    const key = keyOf(VIEWER.email);
    await assertSucceeds(deleteDoc(doc(db, "sessions", SESSION_ID, "members", key)));
    await assertFails(getDoc(doc(db, "sessions", SESSION_ID)));
  });
});

describe("session updates and deletes", () => {
  beforeEach(() => seedSession());

  it("lets the owner end the session and replace invites", async () => {
    const db = dbFor(OWNER);
    await assertSucceeds(
      updateDoc(doc(db, "sessions", SESSION_ID), { status: "ended", updatedAt: serverTimestamp() })
    );
    const key = keyOf("new@example.com");
    await assertSucceeds(
      setDoc(doc(db, "sessions", SESSION_ID, "private", "invites"), {
        emails: ["new@example.com"],
        emailKeys: [key],
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("blocks viewers from editing or deleting the session", async () => {
    const ref = doc(dbFor(VIEWER), "sessions", SESSION_ID);
    await assertFails(updateDoc(ref, { title: "Hijacked", updatedAt: serverTimestamp() }));
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

  it("still lets a legacy invitee read, and lets the owner remove the hash list", async () => {
    await env.clearFirestore();
    await seedSession({ legacy: true });
    await assertSucceeds(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID)));
    await assertSucceeds(
      updateDoc(doc(dbFor(OWNER), "sessions", SESSION_ID), {
        viewerKeys: deleteField(),
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(getDoc(doc(dbFor(VIEWER), "sessions", SESSION_ID)));
  });
});

describe("transcript lines", () => {
  const line = () => ({ text: "How are you?", createdAt: serverTimestamp() });

  it("lets the owner append lines while live, and viewers read a page of them", async () => {
    await seedSession({ lines: 15 });
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
    await assertFails(updateDoc(doc(db, "sessions", SESSION_ID, "lines", "line0"), { text: "Edited." }));
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

  it("stops viewer access once the owner removes their membership", async () => {
    await seedSession();
    const db = dbFor(OWNER);
    const key = keyOf(VIEWER.email);
    await assertSucceeds(deleteDoc(doc(db, "sessions", SESSION_ID, "members", key)));
    await assertSucceeds(deleteDoc(doc(db, "inboxes", key, "sessions", SESSION_ID)));
    await assertFails(getDocs(collection(dbFor(VIEWER), "sessions", SESSION_ID, "lines")));
  });
});

function expectNoViewerKeys(snap: { data: () => Record<string, unknown> | undefined }) {
  const data = snap.data() ?? {};
  if ("viewerKeys" in data) throw new Error("session document still exposes viewerKeys");
}
