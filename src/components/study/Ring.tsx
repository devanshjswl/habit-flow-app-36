interface RingProps {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  trackClass?: string;
  children?: React.ReactNode;
}

export function Ring({ progress, size = 132, stroke = 9, color = "var(--primary)", children }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
