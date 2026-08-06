import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseConfig } from "./firebase-config.functions";

let dbPromise: Promise<Firestore> | null = null;
let appPromise: Promise<FirebaseApp> | null = null;

/** Lazily boot the Firebase app in the browser. */
export function getFirebaseApp(): Promise<FirebaseApp> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Firebase is browser-only"));
  }
  if (!appPromise) {
    appPromise = (async () => {
      const config = await getFirebaseConfig();
      return getApps().length ? getApps()[0] : initializeApp(config);
    })();
  }
  return appPromise;
}

/** Lazily boot Firebase in the browser with offline persistence enabled. */
export function getDb(): Promise<Firestore> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Firestore is browser-only"));
  }
  if (!dbPromise) {
    dbPromise = (async () => {
      const app = await getFirebaseApp();
      return initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    })();
  }
  return dbPromise;
}
