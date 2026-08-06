import { useCallback, useEffect, useMemo, useState } from "react";
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

export function markNotesSeen() {
  localStorage.setItem(SEEN_KEY, String(Date.now()));
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/** Realtime feed of the shared note board. */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const db = await getDb();
        if (cancelled) return;
        unsub = onSnapshot(
          query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(200)),
          (snap) => {
            setNotes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Note));
            setReady(true);
          },
          (e) => setError(e.message),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return useMemo(() => ({ notes, error, ready }), [notes, error, ready]);
}

/** Count of notes from the other person newer than the last time this device opened the board. */
export function useUnreadNotes(uid: UserId | null) {
  const { notes } = useNotes();
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

  return notes.filter((n) => n.uid !== uid && n.createdAt > seen).length;
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
