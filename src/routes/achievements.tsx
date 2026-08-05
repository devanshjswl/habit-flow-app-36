import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppNav } from "@/components/study/AppNav";
import { useCurrentUser, useStudyData } from "@/hooks/use-study";
import { useSettings } from "@/hooks/use-settings";
import {
  USERS,
  achievementsFor,
  dailyTotals,
  formatHours,
  secondsIn,
  startOfWeek,
  streakFor,
  subjectTotals,
} from "@/lib/study";

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
  head: () => ({
    meta: [
      { title: "Achievements & Weekly Review — Study Companion" },
      { name: "description", content: "Badges, milestones and a personalised weekly review of your study habits." },
      { property: "og:title", content: "Achievements & Weekly Review — Study Companion" },
      { property: "og:description", content: "Badges, milestones and a personalised weekly review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AchievementsPage() {
  const navigate = useNavigate();
  const { uid, hydrated } = useCurrentUser();
  const { profiles, sessions, now } = useStudyData();
  useSettings();

  useEffect(() => {
    if (hydrated && !uid) navigate({ to: "/" });
  }, [hydrated, uid, navigate]);

  if (!uid) return <div className="min-h-screen" />;

  const badges = achievementsFor(sessions, uid);
  const earned = badges.filter((b) => b.earned).length;

  const weekStart = startOfWeek().getTime();
  const prevWeekStart = weekStart - 7 * 86400000;
  const thisWeek = secondsIn(sessions, uid, weekStart, now);
  const lastWeek = secondsIn(sessions, uid, prevWeekStart, weekStart);
  const delta = lastWeek ? ((thisWeek - lastWeek) / lastWeek) * 100 : thisWeek > 0 ? 100 : 0;
  const subjects = subjectTotals(sessions, uid, weekStart);
  const days = dailyTotals(sessions, uid, 7);
  const bestDay = days.reduce((a, b) => (b.seconds > a.seconds ? b : a), days[0]);
  const activeDays = days.filter((d) => d.seconds >= 1800).length;
  const streak = streakFor(sessions, uid);
  const goalSec = profiles[uid].dailyGoalHours * 3600;

  const insights: string[] = [];
  if (thisWeek === 0) insights.push("A blank week is just a fresh page. Start with one 25-minute block today.");
  else {
    insights.push(
      delta >= 0
        ? `You're up ${Math.round(delta)}% versus last week — that momentum is real.`
        : `You're down ${Math.round(Math.abs(delta))}% versus last week. One extra session a day closes the gap.`,
    );
    if (subjects[0]) insights.push(`${subjects[0].subject} took most of your time (${formatHours(subjects[0].seconds)}h).`);
    const neglected = USERS[uid].subjects.filter((s) => !subjects.find((x) => x.subject === s));
    if (neglected.length) insights.push(`Untouched this week: ${neglected.slice(0, 3).join(", ")}.`);
    insights.push(
      activeDays >= 6
        ? "Almost perfect attendance this week. Protect that rhythm."
        : `You showed up on ${activeDays} of 7 days — aim for one more next week.`,
    );
    if (bestDay && bestDay.seconds > goalSec) {
      insights.push(
        `Your best day was ${new Date(bestDay.date).toLocaleDateString(undefined, { weekday: "long" })} with ${formatHours(bestDay.seconds)}h.`,
      );
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pl-[76px]">
      <AppNav name={profiles[uid].name} avatar={profiles[uid].avatar} />

      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-display font-bold tracking-tight">Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {earned} of {badges.length} unlocked · {streak}-day streak
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b, i) => (
            <div
              key={b.id}
              className={`glass rounded-2xl p-5 animate-scale-fade transition-all ${b.earned ? "glow-ring" : "opacity-70"}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`text-3xl mb-3 ${b.earned ? "" : "grayscale opacity-50"}`}>{b.icon}</div>
              <h3 className="font-display font-semibold">{b.label}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
              <div className="mt-3 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${b.progress * 100}%`,
                    background: b.earned ? "linear-gradient(90deg, var(--primary), var(--accent-2))" : "var(--muted-foreground)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <section className="glass rounded-3xl p-6">
          <h2 className="font-display text-xl font-semibold">Weekly review</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatHours(thisWeek)}h this week vs {formatHours(lastWeek)}h last week
          </p>
          <ul className="mt-5 space-y-3">
            {insights.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/85">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
