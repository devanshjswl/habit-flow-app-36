import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseConfig } from "./firebase-config.functions";

let dbPromise: Promise<Firestore> | null = null;

/** Lazily boot Firebase in the browser with offline persistence enabled. */
export function getDb(): Promise<Firestore> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Firestore is browser-only"));
  }
  if (!dbPromise) {
    dbPromise = (async () => {
      const config = await getFirebaseConfig();
      const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(config);
      return initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    })();
  }
  return dbPromise;
}
