import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "./client";
import { emulatorHost } from "./config";

let emulatorConnected = false;

/** Kept separate from client.ts so sign-in pages don't ship the Firestore SDK */
export function getDb(): Firestore {
  const db = getFirestore(getFirebaseApp());
  const host = emulatorHost();
  if (host && !emulatorConnected) {
    emulatorConnected = true;
    connectFirestoreEmulator(db, host, 8086);
  }
  return db;
}
