import { useState } from "react";
import { Minus, Plus, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import { USERS, formatHours, secondsIn, startOfWeek, todayKey, type Session, type UserId } from "@/lib/study";

const QUICK = [15, 30, 60];

export function TimeAdjuster({
  uid,
  sessions,
  now,
  onAdjust,
  onRemove,
}: {
  uid: UserId;
  sessions: Session[];
  now: number;
  onAdjust: (subject: string, minutes: number) => Promise<void>;
  onRemove: (ids: string[]) => Promise<void>;
}) {
  const subjects = USERS[uid].subjects;
  const [subject, setSubject] = useState(subjects[0]);
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);

  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todaySec = secondsIn(sessions, uid, todayStart, now);

  const run = async (delta: number) => {
    if (busy || !minutes) return;
    setBusy(true);
    try {
      await onAdjust(subject, delta);
      toast.success(`${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} min · ${subject}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update time");
    } finally {
      setBusy(false);
    }
  };

  const reset = async (scope: "today" | "week") => {
    const since = scope === "today" ? todayStart : startOfWeek().getTime();
    const ids = sessions.filter((s) => s.uid === uid && (s.endedAt ?? s.startedAt) >= since).map((s) => s.id);
    if (!ids.length) {
      toast.info("Nothing to reset");
      return;
    }
    if (!window.confirm(`Reset ${ids.length} ${scope === "today" ? "of today's" : "of this week's"} entries?`)) return;
    setBusy(true);
    try {
      await onRemove(ids);
      toast.success(`Reset ${scope === "today" ? "today" : "this week"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reset");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Timer className="w-3.5 h-3.5" /> Adjust study time
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {formatHours(todaySec)}h today · {todayKey()}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-11 rounded-xl bg-input/60 border px-3 text-sm"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={720}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
            className="h-11 w-full rounded-xl bg-input/60 border px-3 text-sm tabular-nums"
            aria-label="Minutes"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(m)}
            className={`rounded-full px-3 h-8 text-xs transition-colors ${
              minutes === m ? "bg-primary/15 text-primary" : "glass-soft text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(minutes)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 h-11 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(-minutes)}
          className="inline-flex items-center gap-2 rounded-xl glass-soft px-4 h-11 text-sm hover:text-foreground disabled:opacity-50"
        >
          <Minus className="w-4 h-4" /> Deduct
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => reset("today")}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 h-11 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset today
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => reset("week")}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 h-11 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset week
          </button>
        </div>
      </div>
    </div>
  );
}
