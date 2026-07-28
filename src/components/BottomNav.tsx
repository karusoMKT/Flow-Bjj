import { Link } from "@tanstack/react-router";
import { Home, PlusCircle, User } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/checkin", label: "Treino", icon: PlusCircle },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors"
            >
              <Icon className="size-6" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
