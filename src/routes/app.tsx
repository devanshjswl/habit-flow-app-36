import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play, Square, Flame, Target, Timer, Users, LogOut,
  Maximize2, Minimize2, Trophy, Activity, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import {
  DAILY_GOAL_SECONDS, getAllSessions, startSession, endSession,
  getCurrentSlot, clearCurrentSlot, touchSlot,
  startOfWeekIso, formatHMS,
  todaySecondsForSlot, weekSecondsForSlot, computeStreak,
  type SlotName, type StudySession,
} from "@/lib/coop";

export const Route = createFileRoute("/app")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "OSHUDEV — Dashboard" },
      { name: "description", content: "Live co-op focus dashboard for DEV & OSHU." },
    ],
  }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const [mySlot, setMySlot] = useState<SlotName | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [active, setActive] = useState<StudySession | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [tick, setTick] = useState(0);
  const [label, setLabel] = useState("");
  const [ready, setReady] = useState(false);

  // Bootstrap
  useEffect(() => {
    const slot = getCurrentSlot();
    if (!slot) { navigate({ to: "/" }); return; }
    setMySlot(slot);
    touchSlot(slot);
    const since = startOfWeekIso();
    const sessionsSinceWeek = getAllSessions().filter(
      (s) => new Date(s.started_at).getTime() >= new Date(since).getTime()
    );
    setSessions(sessionsSinceWeek);
    const open = sessionsSinceWeek.find((s) => s.slot === slot && !s.ended_at);
    if (open) setActive(open);
    setReady(true);

    const onChange = () => {
      const fresh = getAllSessions().filter(
        (s) => new Date(s.started_at).getTime() >= new Date(since).getTime()
      );
      setSessions(fresh);
    };
    window.addEventListener("oshudev:sessions-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("oshudev:sessions-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFocusMode(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode]);

  const handleStart = useCallback(() => {
    if (!mySlot || active) return;
    const s = startSession(mySlot, focusMode, label.trim() || undefined);
    setActive(s);
    toast.success("Focus started");
  }, [mySlot, active, focusMode, label]);

  const handleStop = useCallback(() => {
    if (!active) return;
    const elapsed = Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000);
    endSession(active.id);
    setActive(null);
    setLabel("");
    toast.success(`Logged ${formatHMS(elapsed)}`);
  }, [active]);

  const { slotStats, combinedToday, combinedGoalPct } = useMemo(() => {
    void tick;
    const stats = (["DEV", "OSHU"] as SlotName[]).map((name) => {
      const today = todaySecondsForSlot(sessions, name);
      const week = weekSecondsForSlot(sessions, name);
      const streak = computeStreak(sessions, name);
      const isLive = !!sessions.find((s) => s.slot === name && !s.ended_at);
      return { name, today, week, streak, isLive };
    });
    const combined = stats.reduce((a, s) => a + s.today, 0);
    const pct = Math.min(100, Math.round((combined / (2 * DAILY_GOAL_SECONDS)) * 100));
    return { slotStats: stats, combinedToday: combined, combinedGoalPct: pct };
  }, [sessions, tick]);

  const me = slotStats.find((s) => s.name === mySlot);
  const partner = slotStats.find((s) => s.name !== mySlot);

  const activeElapsed = active
    ? Math.max(0, Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000))
    : 0;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-mono">Loading…</div>
      </div>
    );
  }

  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full pointer-events-none animate-float-orb"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 24%, transparent), transparent 60%)" }}
        />
        <Particles count={26} />

        <button
          onClick={() => setFocusMode(false)}
          className="absolute top-6 right-6 z-10 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" /> Exit focus · Esc
        </button>

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-primary mb-6">
            {active ? "Focusing" : "Ready when you are"}
          </p>
          <div className="font-mono text-7xl md:text-9xl tabular-nums tracking-tight text-foreground text-glow">
            {formatHMS(activeElapsed)}
          </div>
          {active?.label && <p className="mt-4 text-sm text-muted-foreground italic">{active.label}</p>}

          <div className="mt-12 flex items-center gap-3">
            {!active ? (
              <button onClick={handleStart} className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground glow-ring hover:scale-[1.02] transition-transform">
                <Play className="w-4 h-4" /> Start session
              </button>
            ) : (
              <button onClick={handleStop} className="inline-flex items-center gap-2 rounded-full glass-strong px-8 py-3.5 text-sm font-semibold text-foreground hover:glow-ring transition-all">
                <Square className="w-4 h-4" /> End session
              </button>
            )}
          </div>

          {partner && (
            <div className="mt-16 glass rounded-2xl px-5 py-3 inline-flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${partner.isLive ? "bg-primary animate-pulse-glow" : "bg-muted-foreground/40"}`} />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {partner.name} {partner.isLive ? "is focusing" : "is away"}
              </span>
              <span className="text-xs font-mono tabular-nums text-foreground">{formatHMS(partner.today)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden pb-20">
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
      <Particles count={14} />

      <header className="relative z-10 max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/" className="hidden sm:inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Switch profile
          </Link>
          <button
            onClick={() => { clearCurrentSlot(); navigate({ to: "/" }); }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Leave"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 mt-4">
        <div className="flex items-baseline gap-3 animate-fade-up-blur">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary">CO-OP MODE</p>
          <span className="text-xs text-muted-foreground">·</span>
          <p className="text-xs text-muted-foreground font-mono">You are <span className="text-foreground">{mySlot ?? "—"}</span></p>
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold tracking-tight animate-fade-up-blur" style={{ animationDelay: "60ms" }}>
          Your shared 8-hour ritual.
        </h1>

        <section className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-5 animate-fade-up-blur" style={{ animationDelay: "120ms" }}>
          <TimerPanel
            active={active}
            elapsed={activeElapsed}
            label={label}
            setLabel={setLabel}
            onStart={handleStart}
            onStop={handleStop}
            onFocus={() => setFocusMode(true)}
          />
          <GoalRing pct={combinedGoalPct} combined={combinedToday} />
        </section>

        <section className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up-blur" style={{ animationDelay: "180ms" }}>
          <Stat icon={Timer} label="My today" value={formatHMS(me?.today ?? 0)} sub={`goal ${formatHMS(DAILY_GOAL_SECONDS)}`} />
          <Stat icon={Activity} label="My week" value={formatHMS(me?.week ?? 0)} sub="combined sessions" />
          <Stat icon={Flame} label="My streak" value={`${me?.streak ?? 0}d`} sub="consecutive days" />
          <Stat icon={Users} label="Together today" value={formatHMS(combinedToday)} sub={`${combinedGoalPct}% of 16h`} pulse />
        </section>

        <section className="mt-8 animate-fade-up-blur" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-semibold inline-flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Co-op leaderboard
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">this week</span>
          </div>
          <Leaderboard stats={slotStats} mySlot={mySlot} />
        </section>

        <section className="mt-8 animate-fade-up-blur" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-semibold inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Recent sessions
            </h2>
          </div>
          <RecentSessions sessions={sessions} />
        </section>
      </main>
    </div>
  );
}

function TimerPanel({
  active, elapsed, label, setLabel, onStart, onStop, onFocus,
}: {
  active: StudySession | null;
  elapsed: number;
  label: string;
  setLabel: (s: string) => void;
  onStart: () => void;
  onStop: () => void;
  onFocus: () => void;
}) {
  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%)" }}
      />
      <div className="relative flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-primary animate-pulse-glow" : "bg-muted-foreground/40"}`} />
          {active ? "Focusing" : "Idle"}
        </span>
        <button onClick={onFocus} className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 hover:text-foreground transition-colors">
          <Maximize2 className="w-3 h-3" /> Focus mode
        </button>
      </div>

      <div className="relative mt-6 font-mono text-5xl md:text-7xl tabular-nums tracking-tight text-foreground">
        {formatHMS(elapsed)}
      </div>

      <div className="relative mt-6">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={!!active}
          placeholder="What are you focusing on? (optional)"
          className="w-full bg-transparent border-b border-border/60 focus:border-primary outline-none py-2 text-sm placeholder:text-muted-foreground disabled:opacity-60"
        />
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        {!active ? (
          <button onClick={onStart} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-ring hover:scale-[1.02] transition-transform">
            <Play className="w-4 h-4" /> Start session
          </button>
        ) : (
          <>
            <button onClick={onStop} className="inline-flex items-center gap-2 rounded-full glass-strong px-6 py-3 text-sm font-semibold text-foreground hover:glow-ring transition-all">
              <Square className="w-4 h-4" /> End session
            </button>
            <span className="text-xs text-muted-foreground font-mono">
              started {new Date(active.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function GoalRing({ pct, combined }: { pct: number; combined: number }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - pct / 100);
  return (
    <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground">DAILY 16H GOAL</p>
      <div className="relative w-44 h-44 mt-3">
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r={r} fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth="8" />
          <circle cx="100" cy="100" r={r} fill="none"
            stroke="var(--primary)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl tabular-nums">{pct}%</span>
          <span className="text-[11px] text-muted-foreground mt-1 font-mono tabular-nums">{formatHMS(combined)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-primary" /> Half is yours, half is theirs
      </p>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, sub, pulse,
}: { icon: typeof Timer; label: string; value: string; sub: string; pulse?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
        {sub}
      </div>
    </div>
  );
}

type SlotStat = { name: SlotName; today: number; week: number; streak: number; isLive: boolean };

function Leaderboard({ stats, mySlot }: { stats: SlotStat[]; mySlot: SlotName | null }) {
  const sorted = [...stats].sort((a, b) => b.week - a.week);
  const max = Math.max(1, ...sorted.map((s) => s.week));
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {sorted.map((s, idx) => {
        const pct = Math.round((s.week / max) * 100);
        const isMe = s.name === mySlot;
        return (
          <div key={s.name} className={`glass rounded-2xl p-5 relative overflow-hidden ${isMe ? "glow-ring" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">#{idx + 1}</span>
                <span className="font-display font-semibold text-lg tracking-tight">{s.name}</span>
                {isMe && <span className="text-[10px] font-mono uppercase tracking-widest text-primary">you</span>}
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest ${s.isLive ? "text-primary" : "text-muted-foreground"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.isLive ? "bg-primary animate-pulse-glow" : "bg-muted-foreground/40"}`} />
                {s.isLive ? "live" : "idle"}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">week</p>
                <p className="font-mono text-2xl tabular-nums">{formatHMS(s.week)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">today</p>
                <p className="font-mono text-base tabular-nums">{formatHMS(s.today)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">streak</p>
                <p className="font-mono text-base tabular-nums inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-primary" />{s.streak}d
                </p>
              </div>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${pct}%`, boxShadow: "0 0 12px color-mix(in oklab, var(--primary) 50%, transparent)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: StudySession[] }) {
  const rows = sessions.slice(0, 8);
  if (rows.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground">No sessions yet. Start the first one above.</p>
      </div>
    );
  }
  return (
    <div className="glass rounded-2xl divide-y divide-border/40 overflow-hidden">
      {rows.map((s) => {
        const elapsed = s.ended_at
          ? s.duration_seconds || Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
          : Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000);
        return (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className={`w-1.5 h-1.5 rounded-full ${s.ended_at ? "bg-muted-foreground/40" : "bg-primary animate-pulse-glow"}`} />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground w-12">{s.slot}</span>
            <span className="flex-1 text-sm text-foreground truncate">{s.label || (s.focus_mode ? "Focus session" : "Session")}</span>
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              {new Date(s.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="font-mono text-sm tabular-nums">{formatHMS(elapsed)}</span>
          </div>
        );
      })}
    </div>
  );
}
