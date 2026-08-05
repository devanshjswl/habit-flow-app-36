import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Particles } from "@/components/Particles";
import { setCurrentUser, useStudyData } from "@/hooks/use-study";
import { USERS, USER_IDS, activeSession, formatHours, quoteOfTheDay, secondsIn, type UserId } from "@/lib/study";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/")({
  component: ProfileSelect,
  head: () => ({
    meta: [
      { title: "Study Companion — Two people, one quiet focus" },
      {
        name: "description",
        content: "A calm, shared study space for Dev and Oshu. Live timers, streaks, goals and gentle motivation.",
      },
      { property: "og:title", content: "Study Companion — Two people, one quiet focus" },
      { property: "og:description", content: "A calm, shared study space with live timers, streaks and daily goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProfileSelect() {
  const navigate = useNavigate();
  const { profiles, sessions, now } = useStudyData();
  useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const enter = (id: UserId) => {
    setCurrentUser(id);
    navigate({ to: "/app" });
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh opacity-90 pointer-events-none" />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none animate-float-orb"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 16%, transparent), transparent 62%)" }}
      />
      <Particles count={26} />

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl">
          <div className="text-center animate-fade-up-blur">
            <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-primary mb-4">STUDY COMPANION</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight duo-gradient" style={{ lineHeight: 1.08 }}>
              Who's studying?
            </h1>
            <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
              Two people, two goals, one quiet room. Pick your card and step in.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {USER_IDS.map((id, i) => {
              const meta = USERS[id];
              const p = profiles[id];
              const live = mounted ? activeSession(sessions, id) : null;
              const today = mounted ? secondsIn(sessions, id, todayStart.getTime(), now) : 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => enter(id)}
                  className="group relative text-left animate-scale-fade"
                  style={{ animationDelay: `${i * 130}ms` }}
                >
                  <div
                    className="absolute -inset-1 rounded-[28px] opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${meta.hue === "blue" ? "var(--primary)" : "var(--accent-2)"}, transparent 70%)`,
                    }}
                  />
                  <div className="relative glass-strong rounded-[28px] p-7 group-hover:glow-ring transition-all duration-500 overflow-hidden">
                    <div
                      className="absolute top-0 right-0 w-44 h-44 rounded-full -translate-y-14 translate-x-14 opacity-50"
                      style={{
                        background: `radial-gradient(circle, ${meta.hue === "blue" ? "var(--primary)" : "var(--accent-2)"}, transparent 62%)`,
                      }}
                    />
                    <div className="relative flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-3xl animate-breathe">
                        {p.avatar}
                      </div>
                      {live ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-live-dot" />
                          Studying now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] text-muted-foreground">
                          Ready
                        </span>
                      )}
                    </div>

                    <h2 className="relative mt-6 text-4xl font-display font-bold tracking-tight">{p.name}</h2>
                    <p className="relative mt-1.5 text-xs text-muted-foreground">{meta.goal}</p>

                    <div className="relative mt-8 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatHours(today)}h today · goal {p.dailyGoalHours}h
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Enter <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-12 text-center text-sm text-muted-foreground/80 italic max-w-lg mx-auto">
            "{quoteOfTheDay()}"
          </p>
        </div>
      </main>
    </div>
  );
}
