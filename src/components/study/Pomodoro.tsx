import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { Ring } from "./Ring";
import { POMODORO_PRESETS } from "@/lib/study";
import { playChime, notify } from "@/hooks/use-settings";

interface PomodoroProps {
  sounds: boolean;
  notifications: boolean;
}

export function Pomodoro({ sounds, notifications }: PomodoroProps) {
  const [presetId, setPresetId] = useState("25-5");
  const [customFocus, setCustomFocus] = useState(35);
  const [customBreak, setCustomBreak] = useState(7);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const [rounds, setRounds] = useState(0);
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;
  const notifRef = useRef(notifications);
  notifRef.current = notifications;

  const preset = POMODORO_PRESETS.find((p) => p.id === presetId);
  const focusMin = preset ? preset.focus : customFocus;
  const breakMin = preset ? preset.brk : customBreak;
  const totalSec = (phase === "focus" ? focusMin : breakMin) * 60;

  // Reset the clock whenever the configuration or phase changes while idle.
  useEffect(() => {
    if (!running) setRemaining(totalSec);
  }, [totalSec, running]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        // Phase complete
        playChime(soundsRef.current);
        setPhase((p) => {
          const next = p === "focus" ? "break" : "focus";
          notify(
            notifRef.current,
            next === "break" ? "Break time ☕" : "Back to focus 🎯",
            next === "break" ? "Stretch, breathe, hydrate." : "Let's get another round in.",
          );
          return next;
        });
        setRounds((n) => (phase === "focus" ? n + 1 : n));
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phase]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = totalSec ? 1 - remaining / totalSec : 0;

  const reset = () => {
    setRunning(false);
    setPhase("focus");
    setRemaining(focusMin * 60);
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold">Pomodoro</h3>
          <p className="text-xs text-muted-foreground">
            {phase === "focus" ? "Focus block" : "Break"} · {rounds} round{rounds === 1 ? "" : "s"} today
          </p>
        </div>
        <Coffee className={`w-5 h-5 ${phase === "break" ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      <div className="flex flex-col items-center gap-5">
        <Ring
          progress={progress}
          size={168}
          stroke={10}
          color={phase === "focus" ? "var(--primary)" : "var(--accent-2)"}
        >
          <span className="font-mono text-3xl font-semibold tabular-nums">
            {mm}:{ss}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{phase}</span>
        </Ring>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 h-11 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="w-11 h-11 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Reset pomodoro"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {POMODORO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPresetId(p.id);
                setRunning(false);
                setPhase("focus");
              }}
              className={`rounded-full px-3.5 h-8 text-xs font-medium transition-all ${
                presetId === p.id ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPresetId("custom");
              setRunning(false);
              setPhase("focus");
            }}
            className={`rounded-full px-3.5 h-8 text-xs font-medium transition-all ${
              presetId === "custom" ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom
          </button>
        </div>

        {presetId === "custom" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              Focus
              <input
                type="number"
                min={1}
                max={180}
                value={customFocus}
                onChange={(e) => setCustomFocus(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 h-8 rounded-lg bg-input/60 border px-2 text-foreground text-center"
              />
            </label>
            <label className="flex items-center gap-2">
              Break
              <input
                type="number"
                min={1}
                max={60}
                value={customBreak}
                onChange={(e) => setCustomBreak(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 h-8 rounded-lg bg-input/60 border px-2 text-foreground text-center"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
