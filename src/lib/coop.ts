import { supabase } from "@/integrations/supabase/client";

export type SlotName = "DEV" | "OSHU";

export interface ProfileSlot {
  slot: SlotName;
  user_id: string | null;
  last_visited_at: string | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  focus_mode: boolean;
  label: string | null;
}

export const DAILY_GOAL_SECONDS = 8 * 60 * 60; // 8 hours

export async function fetchSlots(): Promise<ProfileSlot[]> {
  const { data, error } = await supabase
    .from("profile_slots")
    .select("slot, user_id, last_visited_at")
    .order("slot");
  if (error) throw error;
  return (data || []) as ProfileSlot[];
}

export async function claimSlot(slot: SlotName): Promise<ProfileSlot> {
  const { data, error } = await supabase.rpc("claim_profile_slot", { _slot: slot });
  if (error) throw error;
  return data as ProfileSlot;
}

export async function touchSlot(): Promise<void> {
  await supabase.rpc("touch_profile_slot");
}

export async function getMySlot(userId: string): Promise<SlotName | null> {
  const { data } = await supabase
    .from("profile_slots")
    .select("slot")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.slot as SlotName) ?? null;
}

export async function startSession(userId: string, focusMode: boolean, label?: string): Promise<StudySession> {
  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ user_id: userId, focus_mode: focusMode, label: label ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as StudySession;
}

export async function endSession(sessionId: string, durationSeconds: number): Promise<void> {
  const { error } = await supabase
    .from("study_sessions")
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function fetchSessionsSince(sinceIso: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .gte("started_at", sinceIso)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data || []) as StudySession[];
}

export function startOfDayIso(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function startOfWeekIso(d = new Date()): string {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-start
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function todaySecondsForUser(sessions: StudySession[], userId: string, now = new Date()): number {
  const start = new Date(startOfDayIso(now)).getTime();
  let total = 0;
  for (const s of sessions) {
    if (s.user_id !== userId) continue;
    const startedAt = new Date(s.started_at).getTime();
    const endedAt = s.ended_at ? new Date(s.ended_at).getTime() : now.getTime();
    const begin = Math.max(start, startedAt);
    const end = Math.max(begin, endedAt);
    total += Math.floor((end - begin) / 1000);
  }
  return total;
}

/** Compute consecutive-day streak (days with any logged time) ending today/yesterday. */
export function computeStreak(sessions: StudySession[], userId: string): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.user_id !== userId) continue;
    const d = new Date(s.started_at);
    d.setHours(0, 0, 0, 0);
    days.add(d.toISOString().slice(0, 10));
  }
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Allow today empty: start from yesterday if today has nothing
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
