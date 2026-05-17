import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Particles } from "@/components/Particles";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { claimSlot, fetchSlots, getMySlot, touchSlot, type ProfileSlot, type SlotName } from "@/lib/coop";

export const Route = createFileRoute("/select")({
  validateSearch: (s: Record<string, unknown>): { claim?: SlotName } => ({
    claim: (s.claim === "DEV" || s.claim === "OSHU") ? s.claim : undefined,
  }),
  component: SelectPage,
  head: () => ({
    meta: [
      { title: "OSHUDEV — Choose your profile" },
      { name: "description", content: "Step into OSHUDEV. Pick DEV or OSHU and continue your shared focus." },
    ],
  }),
});

function SelectPage() {
  const navigate = useNavigate();
  const { claim } = useSearch({ from: "/select" });
  const [slots, setSlots] = useState<ProfileSlot[] | null>(null);
  const [signingIn, setSigningIn] = useState<SlotName | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Coming back from OAuth with a slot to claim
      if (session?.user && claim) {
        try {
          await claimSlot(claim);
          await touchSlot();
          toast.success(`Welcome, ${claim}.`);
          navigate({ to: "/app" });
          return;
        } catch (err: any) {
          toast.error(err?.message || "Could not claim profile");
        }
      }

      // Already signed in and already owns a slot → go to app
      if (session?.user) {
        const mine = await getMySlot(session.user.id);
        if (mine) {
          await touchSlot();
          navigate({ to: "/app" });
          return;
        }
      }

      try {
        const s = await fetchSlots();
        if (!cancelled) setSlots(s);
      } catch {
        // If unauthenticated, fetchSlots fails (RLS). Show empty cards.
        if (!cancelled) setSlots([{ slot: "DEV", user_id: null, last_visited_at: null }, { slot: "OSHU", user_id: null, last_visited_at: null }]);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [claim, navigate]);

  const handlePick = async (slot: SlotName) => {
    setSigningIn(slot);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/select?claim=${slot}`,
      });
      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : "Sign-in failed");
        setSigningIn(null);
        return;
      }
      if (result.redirected) return; // browser is navigating away

      // Inline token exchange — claim now
      await claimSlot(slot);
      await touchSlot();
      toast.success(`Welcome, ${slot}.`);
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err?.message || "Sign-in failed");
      setSigningIn(null);
    }
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh opacity-90 pointer-events-none" />
      <Particles count={36} />

      <header className="relative z-10 max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-xl mx-auto animate-fade-up-blur">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-4">PROFILE SELECT</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight gradient-text" style={{ lineHeight: 1.08 }}>
            Who's stepping in?
          </h1>
          <p className="mt-5 text-muted-foreground">
            Pick your profile. Sign in with Google to claim it. Your partner will see you online instantly.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {(["DEV", "OSHU"] as SlotName[]).map((name, i) => {
            const slot = slots?.find((s) => s.slot === name);
            return (
              <ProfileCard
                key={name}
                name={name}
                slot={slot}
                loading={signingIn === name}
                onPick={() => handlePick(name)}
                delay={i * 120}
              />
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground font-mono tracking-widest">
          A SPACE FOR TWO · OSHUDEV
        </p>
      </main>
    </div>
  );
}

function ProfileCard({
  name, slot, loading, onPick, delay,
}: { name: SlotName; slot?: ProfileSlot; loading: boolean; onPick: () => void; delay: number }) {
  const claimed = !!slot?.user_id;
  const lastVisited = slot?.last_visited_at ? relTime(slot.last_visited_at) : null;
  const accent = name === "DEV" ? "var(--primary)" : "color-mix(in oklab, var(--primary) 55%, white)";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={loading}
      className="group relative text-left animate-scale-fade disabled:opacity-70 disabled:cursor-wait"
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
            <h2 className="mt-2 text-5xl font-display font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              {name}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${claimed ? "bg-success" : "bg-muted-foreground/60"} ${claimed ? "animate-pulse-glow" : ""}`} />
            {claimed ? "Active" : "Open"}
          </span>
        </div>

        <div className="relative mt-10 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {lastVisited ? <>Last seen <span className="text-foreground/80">{lastVisited}</span></> : "Never visited yet"}
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <>Enter as {name} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>}
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
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
