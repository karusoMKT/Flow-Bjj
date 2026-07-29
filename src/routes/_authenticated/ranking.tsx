import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking | Flow Jiu-Jitsu" },
      { name: "description", content: "Veja o ranking de XP dos atletas do Flow Jiu-Jitsu." },
      { property: "og:title", content: "Ranking | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Veja o ranking de XP dos atletas do Flow Jiu-Jitsu." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-md px-4 pt-8">
        <h1 className="text-2xl font-black italic">Ranking</h1>
        <p className="mt-2 text-sm text-muted-foreground">Em breve: ranking global, nacional e entre amigos.</p>
      </main>
      <BottomNav />
    </div>
  ),
});
