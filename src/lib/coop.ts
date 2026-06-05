// Local-only co-op state. No auth, no backend.
export type SlotName = "DEV" | "OSHU";

export interface StudySession {
  id: string;
  slot: SlotName;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  focus_mode: boolean;
  label: string | null;
}

export const DAILY_GOAL_SECONDS = 8 * 60 * 60;
const SESSIONS_KEY = "oshudev:sessions:v1";
const SLOT_KEY = "oshudev:current-slot";
const LAST_VISITED_KEY = "oshudev:last-visited";

const isBrowser = () => typeof window !== "undefined";

export function getCurrentSlot(): SlotName | null {
  if (!isBrowser()) return null;
  const v = localStorage.getItem(SLOT_KEY);
  return v === "DEV" || v === "OSHU" ? v : null;
}

export function setCurrentSlot(slot: SlotName): void {
  if (!isBrowser()) return;
  localStorage.setItem(SLOT_KEY, slot);
  touchSlot(slot);
}

export function clearCurrentSlot(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SLOT_KEY);
}

export function touchSlot(slot: SlotName): void {
  if (!isBrowser()) return;
  const map = getLastVisitedMap();
  map[slot] = new Date().toISOString();
  localStorage.setItem(LAST_VISITED_KEY, JSON.stringify(map));
}

export function getLastVisitedMap(): Partial<Record<SlotName, string>> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(LAST_VISITED_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getAllSessions(): StudySession[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(s: StudySession[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("oshudev:sessions-changed"));
}

export function startSession(slot: SlotName, focusMode: boolean, label?: string): StudySession {
  const s: StudySession = {
    id: crypto.randomUUID(),
    slot,
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_seconds: 0,
    focus_mode: focusMode,
    label: label ?? null,
  };
  saveSessions([s, ...getAllSessions()]);
  return s;
}

export function endSession(sessionId: string): void {
  const all = getAllSessions();
  const i = all.findIndex((s) => s.id === sessionId);
  if (i === -1) return;
  const startedAt = new Date(all[i].started_at).getTime();
  const dur = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  all[i] = { ...all[i], ended_at: new Date().toISOString(), duration_seconds: dur };
  saveSessions(all);
}

export function getSessionsSince(sinceIso: string): StudySession[] {
  const since = new Date(sinceIso).getTime();
  return getAllSessions().filter((s) => new Date(s.started_at).getTime() >= since);
}

export function startOfDayIso(d = new Date()): string {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.toISOString();
}
export function startOfWeekIso(d = new Date()): string {
  const x = new Date(d); const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x.toISOString();
}

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function todaySecondsForSlot(sessions: StudySession[], slot: SlotName, now = new Date()): number {
  const start = new Date(startOfDayIso(now)).getTime();
  let total = 0;
  for (const s of sessions) {
    if (s.slot !== slot) continue;
    const startedAt = new Date(s.started_at).getTime();
    const endedAt = s.ended_at ? new Date(s.ended_at).getTime() : now.getTime();
    const begin = Math.max(start, startedAt);
    const end = Math.max(begin, endedAt);
    total += Math.floor((end - begin) / 1000);
  }
  return total;
}

export function weekSecondsForSlot(sessions: StudySession[], slot: SlotName, now = new Date()): number {
  let total = 0;
  for (const s of sessions) {
    if (s.slot !== slot) continue;
    const startedAt = new Date(s.started_at).getTime();
    const endedAt = s.ended_at ? new Date(s.ended_at).getTime() : now.getTime();
    total += Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  }
  return total;
}

export function computeStreak(sessions: StudySession[], slot: SlotName): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.slot !== slot) continue;
    const d = new Date(s.started_at); d.setHours(0, 0, 0, 0);
    days.add(d.toISOString().slice(0, 10));
  }
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++; cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
