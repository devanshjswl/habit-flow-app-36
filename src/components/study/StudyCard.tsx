import { useState } from "react";
import { Play, Square, Flame, Clock } from "lucide-react";
import { Ring } from "./Ring";
import {
  USERS,
  activeSession,
  dailyTotals,
  formatHMS,
  formatHours,
  secondsIn,
  sessionSeconds,
  startOfWeek,
  streakFor,
  todayKey,
  MOODS,
  type Profile,
  type Session,
  type UserId,
} from "@/lib/study";

interface StudyCardProps {
  uid: UserId;
  profile: Profile;
  sessions: Session[];
  now: number;
  isMe: boolean;
  onStart?: (subject: string) => void;
  onStop?: (session: Session) => void;
  onPatch?: (patch: Partial<Profile>) => void;
}

export function StudyCard({ uid, profile, sessions, now, isMe, onStart, onStop, onPatch }: StudyCardProps) {
  const meta = USERS[uid];
  const accent = meta.hue === "blue" ? "var(--primary)" : "var(--accent-2)";
  const active = activeSession(sessions, uid);
  const [subject, setSubject] = useState(meta.subjects[0]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySec = secondsIn(sessions, uid, todayStart.getTime(), now);
  const weekSec = secondsIn(sessions, uid, startOfWeek().getTime(), now);
  const streak = streakFor(sessions, uid);
  const goalSec = profile.dailyGoalHours * 3600;
  const progress = goalSec ? todaySec / goalSec : 0;
  const week = dailyTotals(sessions, uid, 7);
  const weekMax = Math.max(3600, ...week.map((d) => d.seconds));

  return (
    <div className="relative glass rounded-3xl p-6 overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_60px_-20px_var(--primary)]">
      <div
        className="absolute -top-24 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 65%)` }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl glass-strong flex items-center justify-center text-2xl shrink-0">
            {profile.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-semibold truncate">{profile.name}</h2>
              {isMe && <span className="text-[10px] rounded-full glass px-2 py-0.5 text-muted-foreground">you</span>}
            </div>
            <p className="text-xs text-muted-foreground truncate">{meta.goal}</p>
          </div>
        </div>
        <span className="text-2xl leading-none shrink-0" title="Mood">
          {profile.mood}
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        {active ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-live-dot" />
            Studying {active.subject}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
            Offline
          </span>
        )}
      </div>

      <div className="relative mt-6 flex items-center gap-6">
        <Ring progress={progress} size={124} stroke={9} color={accent}>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {active ? formatHMS(sessionSeconds(active, now)) : formatHours(todaySec) + "h"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {Math.round(progress * 100)}% of {profile.dailyGoalHours}h
          </span>
        </Ring>

        <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Today" value={`${formatHours(todaySec)}h`} />
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="This week" value={`${formatHours(weekSec)}h`} />
          <Stat icon={<Flame className="w-3.5 h-3.5" />} label="Streak" value={`${streak}d`} />
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Sessions" value={String(sessions.filter((s) => s.uid === uid).length)} />
        </div>
      </div>

      {/* 7-day mini bars */}
      <div className="relative mt-5 flex items-end gap-1.5 h-12">
        {week.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date} — ${formatHours(d.seconds)}h`}>
            <div
              className="rounded-t-md w-full transition-all duration-500"
              style={{
                height: `${Math.max(4, (d.seconds / weekMax) * 100)}%`,
                background:
                  d.date === todayKey()
                    ? accent
                    : `color-mix(in oklab, ${accent} 40%, transparent)`,
              }}
            />
          </div>
        ))}
      </div>

      {isMe ? (
        <div className="relative mt-6 space-y-3">
          <div className="flex gap-2">
            <select
              value={active ? active.subject : subject}
              disabled={!!active}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 h-11 rounded-xl bg-input/60 border px-3 text-sm disabled:opacity-60"
            >
              {meta.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {active ? (
              <button
                type="button"
                onClick={() => onStop?.(active)}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive text-destructive-foreground px-5 h-11 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStart?.(subject)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 h-11 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Play className="w-4 h-4" /> Start
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onPatch?.({ mood: m })}
                className={`w-8 h-8 rounded-lg text-base transition-all ${
                  profile.mood === m ? "bg-primary/15 ring-1 ring-primary/40 scale-110" : "hover:bg-foreground/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea
            value={profile.note}
            onChange={(e) => onPatch?.({ note: e.target.value })}
            placeholder="Today's note…"
            rows={2}
            className="w-full rounded-xl bg-input/60 border px-3 py-2 text-sm resize-none placeholder:text-muted-foreground/60"
          />
        </div>
      ) : (
        <div className="relative mt-6 rounded-xl glass-soft p-3 min-h-[64px]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Note</p>
          <p className="text-sm text-foreground/85 whitespace-pre-wrap">
            {profile.note || <span className="text-muted-foreground/60">Nothing written yet.</span>}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl glass-soft px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
