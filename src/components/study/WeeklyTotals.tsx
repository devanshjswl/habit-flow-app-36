import { CalendarRange } from "lucide-react";
import {
  USERS,
  USER_IDS,
  dailyTotals,
  formatHours,
  secondsIn,
  startOfWeek,
  type Profile,
  type Session,
  type UserId,
} from "@/lib/study";

/** Side-by-side weekly totals for both people, visible to both. */
export function WeeklyTotals({
  profiles,
  sessions,
  now,
  me,
}: {
  profiles: Record<UserId, Profile>;
  sessions: Session[];
  now: number;
  me: UserId;
}) {
  const weekStart = startOfWeek().getTime();
  const rows = USER_IDS.map((id) => {
    const seconds = secondsIn(sessions, id, weekStart, now);
    const days = dailyTotals(sessions, id, 7);
    return { id, seconds, days };
  });
  const max = Math.max(1, ...rows.flatMap((r) => r.days.map((d) => d.seconds)));

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <CalendarRange className="w-3.5 h-3.5" /> Weekly study time
        </div>
        <span className="text-[11px] text-muted-foreground">This week · per person</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl glass-soft p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">
                {profiles[r.id]?.name ?? USERS[r.id].defaultName}
                {r.id === me && <span className="ml-1.5 text-[10px] text-muted-foreground">you</span>}
              </span>
              <span className="font-display text-xl font-semibold tabular-nums">{formatHours(r.seconds)}h</span>
            </div>
            <div className="mt-3 flex items-end gap-1.5 h-16">
              {r.days.map((d) => (
                <div key={d.date} className="flex-1 h-full flex items-end">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${Math.max(3, (Math.max(0, d.seconds) / max) * 100)}%`,
                      background:
                        r.id === me
                          ? "linear-gradient(180deg, var(--primary), var(--accent-2))"
                          : "color-mix(in oklab, var(--primary) 30%, transparent)",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              {r.days.map((d) => (
                <span key={d.date} className="flex-1 text-center">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
