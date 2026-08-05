import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppNav } from "@/components/study/AppNav";
import { Heatmap } from "@/components/study/Heatmap";
import { useCurrentUser, useStudyData } from "@/hooks/use-study";
import { useSettings } from "@/hooks/use-settings";
import { USERS, USER_IDS, dateKey, formatHours, sessionSeconds, type UserId } from "@/lib/study";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Study Calendar — Study Companion" },
      { name: "description", content: "Browse your study history day by day and see how consistent you've both been." },
      { property: "og:title", content: "Study Calendar — Study Companion" },
      { property: "og:description", content: "Browse your study history day by day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CalendarPage() {
  const navigate = useNavigate();
  const { uid, hydrated } = useCurrentUser();
  const { profiles, sessions } = useStudyData();
  useSettings();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !uid) navigate({ to: "/" });
  }, [hydrated, uid, navigate]);

  const cursor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const perDay = useMemo(() => {
    const map = new Map<string, Record<UserId, number>>();
    for (const s of sessions) {
      const cur = map.get(s.date) ?? { dev: 0, oshu: 0 };
      cur[s.uid] += sessionSeconds(s);
      map.set(s.date, cur);
    }
    return map;
  }, [sessions]);

  if (!uid) return <div className="min-h-screen" />;

  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const pad = (cursor.getDay() + 6) % 7;
  const selectedSessions = selected ? sessions.filter((s) => s.date === selected) : [];

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pl-[76px]">
      <AppNav name={profiles[uid].name} avatar={profiles[uid].avatar} />

      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <h1 className="text-3xl font-display font-bold tracking-tight">Study history</h1>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setMonthOffset((m) => m - 1)}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display text-lg font-semibold">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <button
              type="button"
              onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
              disabled={monthOffset >= 0}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: pad }).map((_, i) => (
              <div key={`p${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = new Date(cursor.getFullYear(), cursor.getMonth(), i + 1);
              const key = dateKey(d);
              const totals = perDay.get(key);
              const total = (totals?.dev ?? 0) + (totals?.oshu ?? 0);
              const isToday = key === dateKey(new Date());
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key === selected ? null : key)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-xs transition-all ${
                    selected === key ? "ring-1 ring-primary bg-primary/10" : "hover:bg-foreground/5"
                  } ${isToday ? "ring-1 ring-primary/40" : ""}`}
                  style={
                    total > 0 && selected !== key
                      ? { background: `color-mix(in oklab, var(--primary) ${Math.min(60, 12 + total / 600)}%, transparent)` }
                      : undefined
                  }
                >
                  <span className={total > 0 ? "font-semibold" : "text-muted-foreground"}>{i + 1}</span>
                  {total > 0 && (
                    <div className="flex gap-0.5">
                      {(totals?.dev ?? 0) > 0 && <span className="w-1 h-1 rounded-full bg-primary" />}
                      {(totals?.oshu ?? 0) > 0 && <span className="w-1 h-1 rounded-full" style={{ background: "var(--accent-2)" }} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="glass rounded-3xl p-6 animate-scale-fade">
            <h3 className="font-display text-lg font-semibold mb-4">
              {new Date(selected).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            {selectedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions logged on this day.</p>
            ) : (
              <ul className="space-y-2">
                {selectedSessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl glass-soft px-4 py-3 text-sm">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="w-1.5 h-6 rounded-full"
                        style={{ background: USERS[s.uid].hue === "blue" ? "var(--primary)" : "var(--accent-2)" }}
                      />
                      <span className="font-medium">{profiles[s.uid].name}</span>
                      <span className="text-muted-foreground">{s.subject}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">{formatHours(sessionSeconds(s))}h</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold mb-5">Your last 13 weeks</h3>
          <Heatmap sessions={sessions} uid={uid} color={USERS[uid].hue === "blue" ? "var(--primary)" : "var(--accent-2)"} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {USER_IDS.map((id) => (
            <div key={id} className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium">{profiles[id].name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatHours(sessions.filter((s) => s.uid === id).reduce((a, s) => a + sessionSeconds(s), 0))}h total
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
