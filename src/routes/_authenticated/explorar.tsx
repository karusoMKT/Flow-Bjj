import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_authenticated/explorar")({
  head: () => ({
    meta: [
      { title: "Explorar | Flow Jiu-Jitsu" },
      { name: "description", content: "Descubra atletas, academias e eventos de Jiu-Jitsu perto de você." },
      { property: "og:title", content: "Explorar | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Descubra atletas, academias e eventos de Jiu-Jitsu perto de você." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-2xl font-black italic">Explorar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Em breve: busca de atletas, academias e eventos.</p>
      </main>
      <BottomNav />
    </div>
  ),
});
