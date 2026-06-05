import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Particles } from "@/components/Particles";
import { Logo } from "@/components/Logo";
import { getLastVisitedMap, setCurrentSlot, type SlotName } from "@/lib/coop";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "OSHUDEV — Choose your profile" },
      { name: "description", content: "Pick DEV or OSHU and step into your shared focus space." },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const [lastVisited, setLastVisited] = useState<Partial<Record<SlotName, string>>>({});

  useEffect(() => { setLastVisited(getLastVisitedMap()); }, []);

  const pick = (slot: SlotName) => {
    setCurrentSlot(slot);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh opacity-90 pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full pointer-events-none animate-float-orb"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)" }}
      />
      <Particles count={32} />

      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 h-16 flex items-center">
        <Logo />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-3xl">
          <div className="text-center animate-fade-up-blur">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-4">PROFILE SELECT</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight gradient-text" style={{ lineHeight: 1.08 }}>
              Who's stepping in?
            </h1>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 gap-6">
            {(["DEV", "OSHU"] as SlotName[]).map((name, i) => (
              <ProfileCard key={name} name={name} lastVisited={lastVisited[name]} onPick={() => pick(name)} delay={i * 120} />
            ))}
          </div>

          <p className="mt-12 text-center text-xs text-muted-foreground font-mono tracking-widest">
            A SPACE FOR TWO · OSHUDEV
          </p>
        </div>
      </main>
    </div>
  );
}

function ProfileCard({
  name, lastVisited, onPick, delay,
}: { name: SlotName; lastVisited?: string; onPick: () => void; delay: number }) {
  const accent = name === "DEV" ? "var(--primary)" : "color-mix(in oklab, var(--primary) 55%, white)";
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative text-left animate-scale-fade"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 50%, ${accent}, transparent 70%)` }} />

      <div className="relative glass-strong rounded-3xl p-7 hover:glow-ring transition-all duration-500 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-12 translate-x-12 opacity-50 group-hover:opacity-80 transition-opacity"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 60%)` }} />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground">PROFILE</p>
            <h2 className="mt-2 text-5xl font-display font-bold tracking-tight">{name}</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            Ready
          </span>
        </div>

        <div className="relative mt-10 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {lastVisited ? <>Last seen <span className="text-foreground/80">{relTime(lastVisited)}</span></> : "Never visited yet"}
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            Enter as {name} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
