import { Link } from "@tanstack/react-router";

export function Logo({ to = "/", size = "md" }: { to?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const dot = size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2";
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span className="relative inline-flex">
        <span className={`${dot} rounded-full bg-primary glow-ring`} />
        <span className={`${dot} absolute inset-0 rounded-full bg-primary animate-pulse-glow`} />
      </span>
      <span className={`${text} font-display font-bold tracking-tight text-foreground`}>
        OSHU<span className="text-primary text-glow">DEV</span>
      </span>
    </Link>
  );
}
