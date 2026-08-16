import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getDb, getFirebaseApp } from "@/lib/firebase";
import type { UserId } from "@/lib/study";

export interface Note {
  id: string;
  uid: UserId;
  text: string;
  createdAt: number;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  mediaPath?: string | null;
}

const SEEN_KEY = "sc:notes-seen";
const SEEN_EVENT = "sc:notes-seen-change";

export function getLastSeen(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(SEEN_KEY) ?? 0);
}

export function markNotesSeen(at = Date.now()) {
  localStorage.setItem(SEEN_KEY, String(at));
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/** Reactive last-seen timestamp shared by every badge on the page. */
export function useLastSeen(): number {
  const [seen, setSeen] = useState(0);
  useEffect(() => {
    const sync = () => setSeen(getLastSeen());
    sync();
    window.addEventListener(SEEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SEEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return seen;
}

/* ------------------------------------------------------------------ */
/* Single shared realtime subscription so every badge stays in sync.   */
/* ------------------------------------------------------------------ */

interface NotesState {
  notes: Note[];
  error: string | null;
  ready: boolean;
}

let state: NotesState = { notes: [], error: null, ready: false };
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | null = null;
let starting = false;

function emit(next: Partial<NotesState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function start() {
  if (unsubscribe || starting || typeof window === "undefined") return;
  starting = true;
  (async () => {
    try {
      const db = await getDb();
      unsubscribe = onSnapshot(
        query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(200)),
        (snap) => {
          emit({
            notes: snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Note),
            ready: true,
            error: null,
          });
        },
        (e) => emit({ error: e.message }),
      );
    } catch (e) {
      emit({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      starting = false;
    }
  })();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
  };
}

const serverSnapshot: NotesState = { notes: [], error: null, ready: false };

/** Realtime feed of the shared note board. */
export function useNotes() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot,
  );
}

/** Count of notes from the other person newer than the last time this device opened the board. */
export function useUnreadNotes(uid: UserId | null) {
  const { notes } = useNotes();
  const seen = useLastSeen();
  return useMemo(() => notes.filter((n) => n.uid !== uid && n.createdAt > seen).length, [notes, uid, seen]);
}

export function useNoteActions(uid: UserId | null) {
  const send = useCallback(
    async (text: string, file?: File | null) => {
      if (!uid) return;
      const trimmed = text.trim().slice(0, 2000);
      if (!trimmed && !file) return;

      let mediaUrl: string | null = null;
      let mediaType: Note["mediaType"] = null;
      let mediaPath: string | null = null;

      if (file) {
        const app = await getFirebaseApp();
        const path = `notes/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const storageRef = ref(getStorage(app), path);
        await uploadBytes(storageRef, file, { contentType: file.type });
        mediaUrl = await getDownloadURL(storageRef);
        mediaPath = path;
        mediaType = file.type.startsWith("video") ? "video" : "image";
      }

      const db = await getDb();
      await addDoc(collection(db, "notes"), {
        uid,
        text: trimmed,
        createdAt: Date.now(),
        mediaUrl,
        mediaType,
        mediaPath,
      });
    },
    [uid],
  );

  const remove = useCallback(async (note: Note) => {
    const db = await getDb();
    await deleteDoc(doc(db, "notes", note.id));
    if (note.mediaPath) {
      try {
        const app = await getFirebaseApp();
        await deleteObject(ref(getStorage(app), note.mediaPath));
      } catch {
        /* media already gone */
      }
    }
  }, []);

  return { send, remove };
}
