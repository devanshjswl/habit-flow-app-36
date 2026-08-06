import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, CalendarDays, Trophy, Settings, LogOut, MessageSquare } from "lucide-react";
import { clearCurrentUser, useCurrentUser } from "@/hooks/use-study";
import { useUnreadNotes } from "@/hooks/use-notes";
import { useNavigate } from "@tanstack/react-router";

const ITEMS = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/notes", label: "Notes", icon: MessageSquare },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/achievements", label: "Awards", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppNav({ name, avatar }: { name: string; avatar: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { uid } = useCurrentUser();
  const unread = useUnreadNotes(uid);

  const leave = () => {
    clearCurrentUser();
    navigate({ to: "/" });
  };


  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[76px] z-40 flex-col items-center py-6 gap-2 glass border-r">
        <div className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center text-xl mb-4" title={name}>
          {avatar}
        </div>
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                active ? "bg-primary/15 text-primary glow-ring" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1 text-xs opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                {label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={leave}
          title="Switch profile"
          className="mt-auto w-11 h-11 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
