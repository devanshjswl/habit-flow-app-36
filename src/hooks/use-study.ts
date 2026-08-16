import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { USERS, USER_IDS, dateKey, type Profile, type Session, type UserId } from "@/lib/study";

const CURRENT_KEY = "sc:current-user";

export function getCurrentUser(): UserId | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CURRENT_KEY);
  return v === "dev" || v === "oshu" ? v : null;
}

export function setCurrentUser(id: UserId) {
  localStorage.setItem(CURRENT_KEY, id);
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_KEY);
}

function defaultProfile(id: UserId): Profile {
  return {
    id,
    name: USERS[id].defaultName,
    avatar: id === "dev" ? "🧪" : "🩺",
    mood: "🙂",
    note: "",
    tomorrowPlan: "",
    dailyGoalHours: 6,
  };
}

export interface StudyData {
  ready: boolean;
  error: string | null;
  profiles: Record<UserId, Profile>;
  sessions: Session[];
  now: number;
}

/** Realtime subscription to both profiles and the recent session history. */
export function useStudyData(): StudyData {
  const [profiles, setProfiles] = useState<Record<UserId, Profile>>({
    dev: defaultProfile("dev"),
    oshu: defaultProfile("oshu"),
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let unsubs: Unsubscribe[] = [];
    let cancelled = false;

    (async () => {
      try {
        const db = await getDb();
        if (cancelled) return;

        unsubs.push(
          onSnapshot(
            collection(db, "profiles"),
            (snap) => {
              setProfiles((prev) => {
                const next = { ...prev };
                snap.forEach((d) => {
                  if (USER_IDS.includes(d.id as UserId)) {
                    next[d.id as UserId] = { ...defaultProfile(d.id as UserId), ...(d.data() as object) } as Profile;
                  }
                });
                return next;
              });
              setReady(true);
            },
            (e) => setError(e.message),
          ),
        );

        const since = Date.now() - 400 * 86400000;
        unsubs.push(
          onSnapshot(
            query(collection(db, "sessions"), where("startedAt", ">=", since), orderBy("startedAt", "desc")),
            (snap) => {
              setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Session));
              setReady(true);
            },
            (e) => setError(e.message),
          ),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, []);

  return useMemo(() => ({ ready, error, profiles, sessions, now }), [ready, error, profiles, sessions, now]);
}

export function useStudyActions(uid: UserId | null) {
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    const id = uidRef.current;
    if (!id) return;
    const db = await getDb();
    await setDoc(doc(db, "profiles", id), { ...defaultProfile(id), ...patch, id }, { merge: true });
  }, []);

  const startSession = useCallback(async (subject: string) => {
    const id = uidRef.current;
    if (!id) return;
    const db = await getDb();
    await addDoc(collection(db, "sessions"), {
      uid: id,
      subject,
      startedAt: Date.now(),
      endedAt: null,
      seconds: 0,
      date: dateKey(new Date()),
    });
  }, []);

  const stopSession = useCallback(async (session: Session) => {
    const db = await getDb();
    const endedAt = Date.now();
    await updateDoc(doc(db, "sessions", session.id), {
      endedAt,
      seconds: Math.max(0, Math.floor((endedAt - session.startedAt) / 1000)),
    });
  }, []);

  /** Manually add (positive) or deduct (negative) study minutes. */
  const adjustTime = useCallback(async (subject: string, minutes: number, when = new Date()) => {
    const id = uidRef.current;
    if (!id || !minutes) return;
    const db = await getDb();
    const seconds = Math.round(minutes * 60);
    const endedAt = when.getTime();
    await addDoc(collection(db, "sessions"), {
      uid: id,
      subject,
      startedAt: endedAt - Math.max(0, seconds) * 1000,
      endedAt,
      seconds,
      date: dateKey(when),
      manual: true,
    });
  }, []);

  /** Delete a set of sessions (used by the reset controls). */
  const removeSessions = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    const db = await getDb();
    await Promise.all(ids.map((sid) => deleteDoc(doc(db, "sessions", sid))));
  }, []);

  return { saveProfile, startSession, stopSession, adjustTime, removeSessions };
}

/** Reads the locally selected profile once the component is hydrated. */
export function useCurrentUser(): { uid: UserId | null; hydrated: boolean } {
  const [uid, setUid] = useState<UserId | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setUid(getCurrentUser());
    setHydrated(true);
  }, []);
  return { uid, hydrated };
}
