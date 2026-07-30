import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  UserRound,
  Shield,
  Bell,
  Globe,
  Ruler,
  Palette,
  HelpCircle,
  Info,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  to: string;
  value?: string;
};

const MENU: { items: MenuItem[] }[] = [
  {
    items: [
      { icon: UserRound, label: "Editar perfil", to: "/perfil" },
      { icon: Shield, label: "Privacidade", to: "/settings/privacy" },
      { icon: Bell, label: "Notificações", to: "/notifications" },
    ],
  },
  {
    items: [
      { icon: Globe, label: "Idioma", value: "Português", to: "/settings/language" },
      { icon: Ruler, label: "Unidades", value: "Métrico", to: "/settings/units" },
      { icon: Palette, label: "Tema", value: "Escuro", to: "/settings/theme" },
    ],
  },
  {
    items: [
      { icon: HelpCircle, label: "Ajuda e suporte", to: "/settings/help" },
      { icon: Info, label: "Sobre o Flow", to: "/settings/about" },
    ],
  },
];

function SettingsPage() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto flex max-w-md items-center gap-3 px-4 pt-6">
        <Link
          to="/perfil"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-sans text-lg font-semibold tracking-tight">Configurações</h1>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6">
        {MENU.map((group, groupIndex) => (
          <section key={groupIndex} className="mb-4 overflow-hidden rounded-2xl border border-white/5 bg-surface">
            <ul>
              {group.items.map((item, index) => (
                <li
                  key={item.label}
                  className={`${index !== group.items.length - 1 ? "border-b border-white/5" : ""}`}
                >
                  <Link
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="grid size-8 place-items-center rounded-lg bg-surface-2 text-brand">
                      <item.icon className="size-4" strokeWidth={1.8} />
                    </div>
                    <span className="flex-1 text-[14px] font-medium text-foreground">{item.label}</span>
                    {item.value && <span className="text-[13px] text-muted-foreground">{item.value}</span>}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={signOut}
            className="text-sm font-semibold text-red-500 transition-colors hover:text-red-400"
          >
            Sair da conta
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações | Flow Jiu-Jitsu" },
      { name: "description", content: "Gerencie suas preferências, privacidade e conta no Flow Jiu-Jitsu." },
      { property: "og:title", content: "Configurações | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Gerencie suas preferências, privacidade e conta no Flow Jiu-Jitsu." },
    ],
  }),
  component: SettingsPage,
});
