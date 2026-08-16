export type UserId = "dev" | "oshu";

export interface UserMeta {
  id: UserId;
  defaultName: string;
  goal: string;
  short: string;
  subjects: string[];
  hue: "blue" | "pink";
}

export const USERS: Record<UserId, UserMeta> = {
  dev: {
    id: "dev",
    defaultName: "Dev",
    goal: "B.Tech Chemical Engineering — 1st Year",
    short: "Engineering",
    subjects: [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Engineering Graphics",
      "Programming",
      "Workshop",
      "Communication Skills",
    ],
    hue: "blue",
  },
  oshu: {
    id: "oshu",
    defaultName: "Oshu",
    goal: "Class 12 — NEET Aspirant",
    short: "NEET",
    subjects: ["Physics", "Chemistry", "Botany", "Zoology", "Revision", "Mock Tests"],
    hue: "pink",
  },
};

export const USER_IDS: UserId[] = ["dev", "oshu"];

export interface Profile {
  id: UserId;
  name: string;
  avatar: string;
  mood: string;
  note: string;
  tomorrowPlan: string;
  dailyGoalHours: number;
}

export interface Session {
  id: string;
  uid: UserId;
  subject: string;
  startedAt: number;
  endedAt: number | null;
  seconds: number;
  date: string; // YYYY-MM-DD
}

export const MOODS = ["🙂", "🔥", "😴", "😤", "🧠", "😌", "😵‍💫", "💪", "☕", "🌙"];

export const QUOTES: string[] = [
  "Small steps every day build the life you're dreaming of.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't have to be extreme, just consistent.",
  "The pain of discipline weighs ounces; regret weighs tons.",
  "Study like someone is studying beside you — because they are.",
  "Progress, not perfection. Show up again tomorrow.",
  "Your future self is watching you right now through memories.",
  "One more page. One more problem. One more hour.",
  "Quiet effort, loud results.",
  "You are allowed to be both a masterpiece and a work in progress.",
  "Focus is the new superpower. Guard it.",
  "Nothing worth having comes easy — but it does come.",
];

export function quoteOfTheDay(offset = 0): string {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[(day + offset) % QUOTES.length];
}

export function todayKey(d = new Date()): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function dateKey(d: Date): string {
  return todayKey(d);
}

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d = new Date()): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Live-aware seconds for a session (counts an open session up to `now`). */
export function sessionSeconds(s: Session, now = Date.now()): number {
  if (s.endedAt) return s.seconds;
  return Math.max(0, Math.floor((now - s.startedAt) / 1000));
}

export function secondsIn(sessions: Session[], uid: UserId | null, since: number, now = Date.now()): number {
  let total = 0;
  for (const s of sessions) {
    if (uid && s.uid !== uid) continue;
    if (s.endedAt !== null) {
      // Finished or manually adjusted entries carry their own duration (can be negative).
      if (s.endedAt >= since) total += s.seconds;
      continue;
    }
    const begin = Math.max(since, s.startedAt);
    if (now <= begin) continue;
    total += Math.floor((now - begin) / 1000);
  }
  return total;
}

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function formatHours(totalSeconds: number): string {
  const h = totalSeconds / 3600;
  return h >= 10 ? h.toFixed(0) : h.toFixed(1);
}

export function activeSession(sessions: Session[], uid: UserId): Session | null {
  return sessions.find((s) => s.uid === uid && s.endedAt === null) ?? null;
}

export function streakFor(sessions: Session[], uid: UserId | null): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (uid && s.uid !== uid) continue;
    if (sessionSeconds(s) < 60) continue;
    days.add(s.date);
  }
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Seconds per day for the last `n` days, oldest first. */
export function dailyTotals(sessions: Session[], uid: UserId | null, n: number): { date: string; seconds: number }[] {
  const map = new Map<string, number>();
  const out: { date: string; seconds: number }[] = [];
  for (const s of sessions) {
    if (uid && s.uid !== uid) continue;
    map.set(s.date, (map.get(s.date) ?? 0) + sessionSeconds(s));
  }
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push({ date: key, seconds: map.get(key) ?? 0 });
  }
  return out;
}

export function subjectTotals(sessions: Session[], uid: UserId, since: number): { subject: string; seconds: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.uid !== uid || s.startedAt < since) continue;
    map.set(s.subject, (map.get(s.subject) ?? 0) + sessionSeconds(s));
  }
  return [...map.entries()]
    .map(([subject, seconds]) => ({ subject, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number; // 0..1
}

export function achievementsFor(sessions: Session[], uid: UserId): Achievement[] {
  const mine = sessions.filter((s) => s.uid === uid);
  const totalHours = mine.reduce((a, s) => a + sessionSeconds(s), 0) / 3600;
  const streak = streakFor(sessions, uid);
  const count = mine.length;
  const last7 = dailyTotals(sessions, uid, 7).filter((d) => d.seconds >= 1800).length;
  const longest = Math.max(0, ...mine.map((s) => sessionSeconds(s) / 3600));

  const mk = (id: string, label: string, description: string, icon: string, value: number, target: number): Achievement => ({
    id,
    label,
    description,
    icon,
    earned: value >= target,
    progress: Math.min(1, value / target),
  });

  return [
    mk("first", "First Step", "Log your very first session", "🌱", count, 1),
    mk("streak7", "7-Day Streak", "Study 7 days in a row", "🔥", streak, 7),
    mk("streak30", "30-Day Streak", "A full month, unbroken", "🏔️", streak, 30),
    mk("h10", "10 Hours", "Ten hours of focused work", "⏳", totalHours, 10),
    mk("h100", "100 Hours", "The hundred-hour club", "💎", totalHours, 100),
    mk("h500", "500 Hours", "Deep mastery territory", "👑", totalHours, 500),
    mk("consistency", "Consistency", "30+ min on all of the last 7 days", "📐", last7, 7),
    mk("marathon", "Marathon", "A single 3-hour session", "🚀", longest, 3),
    mk("sessions50", "Fifty Sessions", "Log 50 study sessions", "📚", count, 50),
  ];
}

export const POMODORO_PRESETS = [
  { id: "25-5", label: "25 / 5", focus: 25, brk: 5 },
  { id: "50-10", label: "50 / 10", focus: 50, brk: 10 },
  { id: "90-20", label: "90 / 20", focus: 90, brk: 20 },
];
