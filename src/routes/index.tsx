import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Timer, Target, Flame, Users, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { Particles } from "@/components/Particles";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { fetchSessionsSince, startOfDayIso, startOfWeekIso, todaySecondsForUser, formatHMS, computeStreak, DAILY_GOAL_SECONDS, type StudySession } from "@/lib/coop";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "OSHUDEV — Study together, focus deeper" },
      { name: "description", content: "A premium co-op study platform for DEV & OSHU. Live timers, synced focus mode, daily 8H goals, and shared streaks." },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();

  // Soft auto-route: if signed-in user already has a session, send them along.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden">
      <Nav />
      <Hero />
      <LiveStrip />
      <Features />
      <ExperienceBlock />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── Nav ── */
function Nav() {
  return (
    <header className="relative z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#experience" className="hover:text-foreground transition-colors">Experience</a>
          <a href="#cta" className="hover:text-foreground transition-colors">Get started</a>
        </nav>
        <Link
          to="/select"
          className="group inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-medium text-foreground hover:glow-ring transition-all"
        >
          Enter <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

/* ── Hero ── */
function Hero() {
  return (
    <section className="relative pt-10 pb-28 lg:pt-20 lg:pb-40">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full pointer-events-none animate-float-orb"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)" }}
      />
      <Particles count={30} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="animate-fade-up-blur inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-pulse-glow" />
              <span className="absolute inset-0 rounded-full bg-primary" />
            </span>
            Built for two. DEV &amp; OSHU.
          </span>

          <h1
            className="animate-fade-up-blur mt-6 text-5xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight gradient-text"
            style={{ animationDelay: "80ms", lineHeight: 1.04 }}
          >
            Study together.<br />Focus deeper.
          </h1>

          <p
            className="animate-fade-up-blur mt-6 text-base sm:text-lg text-muted-foreground max-w-xl"
            style={{ animationDelay: "160ms" }}
          >
            A co-op focus space for two. Live timers, synced focus mode, daily 8-hour goals and a shared streak that only grows when you both show up.
          </p>

          <div
            className="animate-fade-up-blur mt-10 flex flex-col sm:flex-row items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to="/select"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground glow-ring hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Enter OSHUDEV
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-medium text-foreground hover:bg-card transition-all"
            >
              See what's inside
            </a>
          </div>
        </div>

        {/* Hero stats card */}
        <HeroStatsCard />
      </div>
    </section>
  );
}

function HeroStatsCard() {
  const [stats, setStats] = useState<{ today: number; week: number; streak: number }>({ today: 0, week: 0, streak: 0 });

  useEffect(() => {
    let cancelled = false;
    let tick: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const since = startOfWeekIso();
        const sessions = await fetchSessionsSince(since);
        if (cancelled) return;
        compute(sessions);
        tick = setInterval(() => compute(sessions), 1000);
      } catch {/* not signed-in users still see zeros */}
    };

    const compute = (sessions: StudySession[]) => {
      const now = new Date();
      const startDay = new Date(startOfDayIso(now)).getTime();
      const startWeek = new Date(startOfWeekIso(now)).getTime();
      let today = 0;
      let week = 0;
      for (const s of sessions) {
        const startedAt = new Date(s.started_at).getTime();
        const endedAt = s.ended_at ? new Date(s.ended_at).getTime() : now.getTime();
        // week
        const wb = Math.max(startWeek, startedAt);
        const we = Math.max(wb, endedAt);
        week += Math.floor((we - wb) / 1000);
        // today
        const tb = Math.max(startDay, startedAt);
        const te = Math.max(tb, endedAt);
        today += Math.floor((te - tb) / 1000);
      }
      const allUserIds = [...new Set(sessions.map((s) => s.user_id))];
      const streak = Math.max(0, ...allUserIds.map((u) => computeStreak(sessions, u)));
      setStats({ today, week, streak });
    };

    load();
    return () => { cancelled = true; if (tick) clearInterval(tick); };
  }, []);

  const goalPct = Math.min(100, Math.round((stats.today / (2 * DAILY_GOAL_SECONDS)) * 100));

  return (
    <div className="animate-scale-fade mt-16 relative max-w-4xl mx-auto" style={{ animationDelay: "320ms" }}>
      <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent), transparent 60%)" }} />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem icon={Timer} label="Today together" value={formatHMS(stats.today)} sub="live" pulse />
          <StatItem icon={Activity} label="This week" value={formatHMS(stats.week)} sub="combined" />
          <StatItem icon={Flame} label="Best streak" value={`${stats.streak}d`} sub="of you two" />
          <StatItem icon={Target} label="Daily goal" value={`${goalPct}%`} sub="of 16h shared" />
        </div>
        <div className="neon-divider mt-6" />
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Users className="w-3.5 h-3.5" /> 2 / 2 focused</span>
          <span className="font-mono tracking-widest">OSHUDEV · CO-OP MODE</span>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon, label, value, sub, pulse,
}: { icon: typeof Timer; label: string; value: string; sub: string; pulse?: boolean }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl md:text-3xl text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
        {sub}
      </div>
    </div>
  );
}

/* ── Live strip ── */
function LiveStrip() {
  const items = [
    "Live presence", "Synced timers", "Focus mode", "Daily 8H goal", "Weekly heatmap", "Streak shield", "Side-by-side analytics",
  ];
  return (
    <div className="relative border-y border-border/40 overflow-hidden">
      <div className="flex gap-12 py-4 animate-[ticker_30s_linear_infinite]" style={{ width: "max-content" }}>
        {[...items, ...items, ...items].map((t, i) => (
          <div key={i} className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Features ── */
const features = [
  { icon: Timer, title: "Live synced timers", desc: "See each other's focus session in real time. Start together. Finish together." },
  { icon: Target, title: "8-hour daily goal", desc: "A single shared ring. Fill it together — half is yours, half is theirs." },
  { icon: Flame, title: "Co-op streak", desc: "The streak only counts when both show up. It's stronger because it's shared." },
  { icon: Sparkles, title: "Focus mode", desc: "A distraction-free full-screen timer with ambient pulse and gentle haptic-style feedback." },
  { icon: Activity, title: "Weekly heatmap", desc: "Watch your weeks fill in. Subtle, beautiful, undeniable." },
  { icon: ShieldCheck, title: "Just for two", desc: "No social feed. No notifications you didn't ask for. Just OSHU and DEV." },
];

function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-4">FEATURES</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Minimal interface.<br />Maximum momentum.
          </h2>
          <p className="mt-5 text-muted-foreground">
            Everything you need to make eight focused hours feel earned — and nothing you don't.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="group glass rounded-2xl p-6 hover:glow-ring transition-all duration-500">
              <div className="w-11 h-11 rounded-xl glass-strong flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Experience preview ── */
function ExperienceBlock() {
  return (
    <section id="experience" className="relative py-28">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-4">THE EXPERIENCE</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            One ritual.<br />Two screens.<br />Zero friction.
          </h2>
          <p className="mt-5 text-muted-foreground max-w-md">
            Pick your profile. Tap focus. The timer starts on both your devices — and the only thing that matters next is the next hour.
          </p>
          <Link
            to="/select"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-ring hover:scale-[1.02] transition-transform"
          >
            Choose your profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-mesh opacity-60 blur-2xl pointer-events-none" />
          <div className="relative glass-strong rounded-3xl p-7 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono uppercase tracking-widest">
              <span>FOCUS · 02:14:33</span>
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" /> LIVE</span>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <div className="relative w-56 h-56">
                <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
                  <circle cx="100" cy="100" r="88" fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth="8" />
                  <circle cx="100" cy="100" r="88" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="553" strokeDashoffset="180" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-5xl tabular-nums">67%</span>
                  <span className="text-xs text-muted-foreground mt-2">of daily 8H</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { who: "DEV", time: "04:12:08", color: "var(--primary)" },
                { who: "OSHU", time: "03:42:25", color: "color-mix(in oklab, var(--primary) 60%, white)" },
              ].map((p) => (
                <div key={p.who} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{p.who}</span>
                  </div>
                  <p className="mt-2 font-mono text-xl tabular-nums">{p.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ── */
function FinalCTA() {
  return (
    <section id="cta" className="relative py-32">
      <div className="absolute inset-0 bg-mesh opacity-80 pointer-events-none" />
      <Particles count={20} />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight gradient-text" style={{ lineHeight: 1.08 }}>
          The next 8 hours<br />are yours to claim.
        </h2>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
          Step in. Pick your profile. Start the timer. OSHUDEV is waiting.
        </p>
        <Link
          to="/select"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground glow-ring hover:scale-[1.02] transition-transform"
        >
          Enter OSHUDEV <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
          OSHUDEV · for the two of us
        </p>
      </div>
    </footer>
  );
}
