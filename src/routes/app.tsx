import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Sparkles, Users, Target, TrendingUp, MessageSquare } from "lucide-react";
import { AppNav } from "@/components/study/AppNav";
import { StudyCard } from "@/components/study/StudyCard";
import { Pomodoro } from "@/components/study/Pomodoro";
import { NotesPanel } from "@/components/study/NotesPanel";
import { TimeAdjuster } from "@/components/study/TimeAdjuster";
import { WeeklyTotals } from "@/components/study/WeeklyTotals";
import { Heatmap } from "@/components/study/Heatmap";
import { Ring } from "@/components/study/Ring";
import { useCurrentUser, useStudyActions, useStudyData } from "@/hooks/use-study";
import { useSettings } from "@/hooks/use-settings";
import { useUnreadNotes } from "@/hooks/use-notes";
import {
  USERS,
  USER_IDS,
  dailyTotals,
  formatHours,
  quoteOfTheDay,
  secondsIn,
  startOfWeek,
  streakFor,
  subjectTotals,
  todayKey,
} from "@/lib/study";

export const Route = createFileRoute("/app")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Study Companion" },
      { name: "description", content: "Live study timers, daily goals, streaks and shared progress for Dev and Oshu." },
      { property: "og:title", content: "Dashboard — Study Companion" },
      { property: "og:description", content: "Live study timers, daily goals, streaks and shared progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Dashboard() {
  const navigate = useNavigate();
  const { uid, hydrated } = useCurrentUser();
  const { profiles, sessions, now, error } = useStudyData();
  const { saveProfile, startSession, stopSession, adjustTime, removeSessions } = useStudyActions(uid);
  const { settings } = useSettings();
  const unreadNotes = useUnreadNotes(uid);

  useEffect(() => {
    if (hydrated && !uid) navigate({ to: "/" });
  }, [hydrated, uid, navigate]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  if (!uid) return <div className="min-h-screen" />;

  const me = profiles[uid];
  const otherId = USER_IDS.find((i) => i !== uid)!;
  const combinedToday = secondsIn(sessions, null, todayStart, now);
  const combinedGoal = (profiles.dev.dailyGoalHours + profiles.oshu.dailyGoalHours) * 3600;
  const weekSec = secondsIn(sessions, null, startOfWeek().getTime(), now);
  const totalSec = sessions.reduce((a, s) => a + (s.endedAt ? s.seconds : Math.floor((now - s.startedAt) / 1000)), 0);
  const sharedStreak = streakFor(sessions, null);
  const week = dailyTotals(sessions, null, 7);
  const weekMax = Math.max(3600, ...week.map((d) => d.seconds));
  const mySubjects = subjectTotals(sessions, uid, startOfWeek().getTime());
  const subjMax = Math.max(1, ...mySubjects.map((s) => s.seconds));

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pl-[76px]">
      <AppNav name={me.name} avatar={me.avatar} />

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up-blur">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-1.5 text-3xl md:text-4xl font-display font-bold tracking-tight">
              Hey {me.name.split(" ")[0]}, <span className="duo-gradient">let's build today.</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/notes"
              className="relative inline-flex items-center gap-2 rounded-2xl glass px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Notes
              {unreadNotes > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadNotes > 9 ? "9+" : unreadNotes}
                </span>
              )}
            </Link>
            <div className="rounded-2xl glass px-4 py-2.5 text-xs text-muted-foreground">
              {USERS[otherId].defaultName} is {sessions.some((s) => s.uid === otherId && !s.endedAt) ? (
                <span className="text-success font-medium">studying right now</span>
              ) : (
                "not studying yet"
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Sync issue: {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <StudyCard
            uid={uid}
            profile={me}
            sessions={sessions}
            now={now}
            isMe
            onStart={startSession}
            onStop={stopSession}
            onPatch={saveProfile}
          />
          <StudyCard uid={otherId} profile={profiles[otherId]} sessions={sessions} now={now} isMe={false} />
        </div>

        {/* Shared overview */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              <Users className="w-3.5 h-3.5" /> Together today
            </div>
            <Ring progress={combinedGoal ? combinedToday / combinedGoal : 0} size={156} stroke={11}>
              <span className="font-display text-3xl font-bold tabular-nums">{formatHours(combinedToday)}h</span>
              <span className="text-[11px] text-muted-foreground mt-1">of {combinedGoal / 3600}h combined</span>
            </Ring>
          </div>

          <div className="glass rounded-3xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" /> This week together
              </div>
              <span className="font-display text-lg font-semibold">{formatHours(weekSec)}h</span>
            </div>
            <div className="flex items-end gap-2 h-32">
              {week.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-t-lg animate-bar"
                      style={{
                        height: `${Math.max(3, (d.seconds / weekMax) * 100)}%`,
                        background:
                          d.date === todayKey()
                            ? "linear-gradient(180deg, var(--primary), var(--accent-2))"
                            : "color-mix(in oklab, var(--primary) 35%, transparent)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.date).toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniStat label="Total hours" value={`${formatHours(totalSec)}h`} />
              <MiniStat label="Sessions" value={String(sessions.length)} />
              <MiniStat label="Shared streak" value={`${sharedStreak}d`} />
            </div>
          </div>
        </section>

        <WeeklyTotals profiles={profiles} sessions={sessions} now={now} me={uid} />

        <TimeAdjuster uid={uid} sessions={sessions} now={now} onAdjust={adjustTime} onRemove={removeSessions} />

        <section className="grid lg:grid-cols-2 gap-6">
          <NotesPanel uid={uid} profiles={profiles} limit={4} autoMarkSeen={false} />
          <Pomodoro sounds={settings.sounds} notifications={settings.notifications} />


          <div className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                <Target className="w-3.5 h-3.5" /> Your subjects this week
              </div>
              {mySubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet this week — start one above.</p>
              ) : (
                <div className="space-y-3">
                  {mySubjects.map((s) => (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-foreground/85">{s.subject}</span>
                        <span className="text-muted-foreground tabular-nums">{formatHours(s.seconds)}h</span>
                      </div>
                      <div className="h-2 rounded-full bg-foreground/8 overflow-hidden">
                        <div
                          className="h-full rounded-full animate-bar"
                          style={{
                            width: `${(s.seconds / subjMax) * 100}%`,
                            background: "linear-gradient(90deg, var(--primary), var(--accent-2))",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Motivation
              </div>
              <p className="font-display text-lg leading-relaxed text-foreground/90">"{quoteOfTheDay()}"</p>
              <div className="mt-5">
                <label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tomorrow's plan</label>
                <textarea
                  value={me.tomorrowPlan}
                  onChange={(e) => saveProfile({ tomorrowPlan: e.target.value })}
                  rows={3}
                  placeholder="What will future-you thank you for?"
                  className="mt-2 w-full rounded-xl bg-input/60 border px-3 py-2 text-sm resize-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold">Consistency map</h2>
            <span className="text-xs text-muted-foreground">Last 13 weeks · both of you</span>
          </div>
          <Heatmap sessions={sessions} uid={null} />
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl glass-soft px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
