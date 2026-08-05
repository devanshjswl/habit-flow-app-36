import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, Bell, Volume2, Palette, User, Target } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/study/AppNav";
import { useCurrentUser, useStudyActions, useStudyData } from "@/hooks/use-study";
import { ACCENTS, useSettings } from "@/hooks/use-settings";
import { USERS } from "@/lib/study";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Study Companion" },
      { name: "description", content: "Customise your profile, daily goal, accent colour, sounds, notifications and backups." },
      { property: "og:title", content: "Settings — Study Companion" },
      { property: "og:description", content: "Profile, goals, accent colours, sounds, notifications and backups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const AVATARS = ["🧪", "🩺", "📘", "🧠", "🌙", "⚗️", "🔬", "🚀", "🌸", "🎧"];

function SettingsPage() {
  const navigate = useNavigate();
  const { uid, hydrated } = useCurrentUser();
  const { profiles, sessions } = useStudyData();
  const { saveProfile } = useStudyActions(uid);
  const { settings, update } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (hydrated && !uid) navigate({ to: "/" });
  }, [hydrated, uid, navigate]);

  useEffect(() => {
    if (uid) setName(profiles[uid].name);
  }, [uid, profiles]);

  useEffect(() => {
    document.documentElement.dataset.motion = settings.reduceMotion ? "reduced" : "";
  }, [settings.reduceMotion]);

  if (!uid) return <div className="min-h-screen" />;
  const me = profiles[uid];

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ profiles, sessions, exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-companion-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const importBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data.profiles || !data.sessions) throw new Error("Unrecognised file");
      const mine = data.profiles[uid];
      if (mine) await saveProfile(mine);
      toast.success("Profile restored from backup", {
        description: "Session history is kept in sync automatically and was not overwritten.",
      });
    } catch (e) {
      toast.error("Couldn't read that backup", { description: e instanceof Error ? e.message : undefined });
    }
  };

  const askNotifications = async (on: boolean) => {
    if (on && "Notification" in window && Notification.permission !== "granted") {
      const res = await Notification.requestPermission();
      if (res !== "granted") {
        toast.error("Notifications were blocked by your browser");
        return;
      }
    }
    update({ notifications: on });
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pl-[76px]">
      <AppNav name={me.name} avatar={me.avatar} />

      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>

        <Section icon={<User className="w-3.5 h-3.5" />} title="Profile">
          <label className="block text-xs text-muted-foreground mb-1.5">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && saveProfile({ name: name.trim() })}
            className="w-full h-11 rounded-xl bg-input/60 border px-3 text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">{USERS[uid].goal}</p>

          <label className="block text-xs text-muted-foreground mt-5 mb-2">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => saveProfile({ avatar: a })}
                className={`w-11 h-11 rounded-xl text-xl transition-all ${
                  me.avatar === a ? "bg-primary/15 ring-1 ring-primary/50 scale-105" : "glass-soft hover:bg-foreground/5"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={<Target className="w-3.5 h-3.5" />} title="Daily goal">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={14}
              step={0.5}
              value={me.dailyGoalHours}
              onChange={(e) => saveProfile({ dailyGoalHours: Number(e.target.value) })}
              className="flex-1 accent-[var(--primary)]"
            />
            <span className="font-display text-xl font-semibold tabular-nums w-16 text-right">{me.dailyGoalHours}h</span>
          </div>
        </Section>

        <Section icon={<Palette className="w-3.5 h-3.5" />} title="Accent colour">
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ accent: a.id })}
                className={`flex items-center gap-2 rounded-full pl-2 pr-4 h-10 text-xs font-medium transition-all ${
                  settings.accent === a.id ? "ring-1 ring-primary bg-primary/10" : "glass-soft hover:bg-foreground/5"
                }`}
              >
                <span className="w-6 h-6 rounded-full" style={{ background: a.swatch }} />
                {a.label}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={<Bell className="w-3.5 h-3.5" />} title="Experience">
          <Toggle
            label="Notifications"
            hint="Pomodoro phase alerts"
            checked={settings.notifications}
            onChange={askNotifications}
          />
          <Toggle
            label="Sounds"
            hint="Soft chime between focus and break"
            checked={settings.sounds}
            onChange={(v) => update({ sounds: v })}
            icon={<Volume2 className="w-3.5 h-3.5" />}
          />
          <Toggle
            label="Reduce motion"
            hint="Calmer, animation-free interface"
            checked={settings.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">Dark theme</p>
              <p className="text-xs text-muted-foreground">Study Companion is designed dark-only for late nights.</p>
            </div>
            <span className="text-xs text-muted-foreground">Always on</span>
          </div>
        </Section>

        <Section icon={<Download className="w-3.5 h-3.5" />} title="Backup">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 h-11 text-sm font-semibold hover:opacity-90"
            >
              <Download className="w-4 h-4" /> Export data
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl glass px-4 h-11 text-sm font-semibold hover:bg-foreground/5"
            >
              <Upload className="w-4 h-4" /> Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importBackup(f);
                e.target.value = "";
              }}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  icon,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <p className="text-sm font-medium flex items-center gap-2">
          {icon}
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full p-0.5 transition-colors ${checked ? "bg-primary" : "bg-foreground/15"}`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-background transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
