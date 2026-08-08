import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Map, X } from "lucide-react";

type Entry = { to: string; label: string };

const ROUTES: Entry[] = [
  { to: "/home", label: "Início (Feed)" },
  { to: "/perfil", label: "Perfil" },
  { to: "/statistics", label: "Estatísticas" },
  { to: "/ranking", label: "Ranking" },
  { to: "/achievements", label: "Conquistas" },
  { to: "/challenges", label: "Desafios" },
  { to: "/search", label: "Busca" },
  { to: "/explore", label: "Explorar" },
  { to: "/checkin", label: "Check-in" },
  { to: "/notifications", label: "Notificações" },
  { to: "/settings", label: "Configurações" },
  { to: "/settings/notifications", label: "Preferências de notificação" },
  { to: "/premium", label: "Flow Premium" },
  { to: "/coach", label: "IA Coach" },
  { to: "/training-plan", label: "Plano de Treino" },
  { to: "/analysis", label: "Análise" },
];

export function DevRoutesMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-brand"
      >
        <Map className="size-4" />
        Mapeamento de Telas (dev)
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button type="button" aria-label="Fechar" className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative mx-auto max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold">Mapeamento de Telas</h2>
              <button
                type="button"
                aria-label="Fechar mapeamento"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <ul className="mt-4 space-y-1.5">
              {ROUTES.map((route) => (
                <li key={route.to}>
                  <Link
                    to={route.to as "/home"}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-2/50 px-3.5 py-2.5 text-sm transition-colors hover:border-brand/40"
                  >
                    <span className="font-medium">{route.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{route.to}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/gym/$gymId"
                  params={{ gymId: "1" }}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-2/50 px-3.5 py-2.5 text-sm transition-colors hover:border-brand/40"
                >
                  <span className="font-medium">Página da Academia</span>
                  <span className="font-mono text-[11px] text-muted-foreground">/gym/1</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
