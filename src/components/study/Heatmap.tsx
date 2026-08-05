import { dailyTotals, formatHours, type Session, type UserId } from "@/lib/study";

interface HeatmapProps {
  sessions: Session[];
  uid: UserId | null;
  days?: number;
  color?: string;
}

export function Heatmap({ sessions, uid, days = 91, color = "var(--primary)" }: HeatmapProps) {
  const data = dailyTotals(sessions, uid, days);
  const max = Math.max(3600, ...data.map((d) => d.seconds));

  // Pad so the first column starts on a Monday.
  const first = new Date(data[0].date);
  const pad = (first.getDay() + 6) % 7;

  return (
    <div className="space-y-2">
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridAutoColumns: "minmax(0, 1fr)" }}>
        {Array.from({ length: pad }).map((_, i) => (
          <div key={`p${i}`} className="aspect-square rounded-[3px] opacity-0" />
        ))}
        {data.map((d) => {
          const intensity = d.seconds === 0 ? 0 : 0.18 + 0.82 * Math.min(1, d.seconds / max);
          return (
            <div
              key={d.date}
              title={`${d.date} — ${formatHours(d.seconds)}h`}
              className="aspect-square rounded-[3px] transition-transform hover:scale-125"
              style={{
                background:
                  d.seconds === 0
                    ? "color-mix(in oklab, var(--foreground) 7%, transparent)"
                    : `color-mix(in oklab, ${color} ${Math.round(intensity * 100)}%, transparent)`,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.15, 0.35, 0.6, 0.85, 1].map((o) => (
          <span
            key={o}
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ background: `color-mix(in oklab, ${color} ${o * 100}%, transparent)` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
