import { useMemo } from "react";

interface ParticlesProps {
  count?: number;
  className?: string;
}

/** Pure-CSS floating particles. Cheap, no JS animation loop. */
export function Particles({ count = 28, className = "" }: ParticlesProps) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const duration = 14 + Math.random() * 22;
        const delay = -Math.random() * duration;
        const size = 1.5 + Math.random() * 3;
        const opacity = 0.25 + Math.random() * 0.5;
        return { i, left, duration, delay, size, opacity };
      }),
    [count],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.i}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
