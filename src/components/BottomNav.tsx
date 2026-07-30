import { Link } from "@tanstack/react-router";
import { Compass, Home, Plus, Trophy, User } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/explore", label: "Explorar", icon: Compass },
  { to: "/create", label: "", icon: Plus, primary: true },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon, ...rest }) => {
          const primary = "primary" in rest && rest.primary;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeProps={{ className: primary ? "" : "text-brand" }}
                inactiveProps={{ className: primary ? "" : "text-muted-foreground" }}
                className="flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors"
              >
                {primary ? (
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_8px_24px_-8px_var(--brand)]">
                    <Icon className="size-6" strokeWidth={2.5} />
                  </span>
                ) : (
                  <>
                    <Icon className="size-6" />
                    {label}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
