import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, BarChart3, Bot, CalendarDays, Lock, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MarkdownText } from "@/components/MarkdownText";
import { ProBadge } from "@/components/ProBadge";
import { supabase } from "@/integrations/supabase/client";
import { getNextBeltObjective } from "@/lib/belt";

// System Prompt: Você é um professor faixa preta de Jiu-Jitsu. Ajude o atleta com drills, táticas e prevenção de lesões.

const FREE_LIMIT = 3;

type Message = { id: string; role: "assistant" | "user"; text: string };

const QUICK_PROMPTS = [
  "Como evitar ser raspado na meia-guarda?",
  "Melhorar meu gás",
  "Raspagens de guarda fechada",
  "Defesa de armlock",
  "Treino para faixa azul",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Oss! Sou seu **faixa preta virtual**. Me conte o que travou no último treino e eu monto o plano.",
  },
];

const MOCK_ANSWER = `**Meia-guarda: pare de ser raspado**

O erro clássico é ficar com o peso alto e o braço perto do quadril do oponente. Corrija a base antes de pensar em passagem.

1. **Mate o underhook.** Assim que ele buscar o underhook, encaixe o *whizzer* e cole a orelha no ombro dele.
2. **Peso na diagonal.** Jogue o peso no ombro do lado do whizzer — não sobre o joelho preso.
3. **Livre o joelho preso.** Use o joelho de fora como cunha e "pise" para fora do bloqueio.
4. **Cabeça sempre acima.** Se a sua cabeça passar da linha do peito dele, a raspagem chega.

**Drills sugeridos (3 rounds de 5 min)**
- Drill de whizzer isolado: parceiro tenta o underhook 20x, você só defende.
- Passagem em knee-cut a partir da meia-guarda, 10x cada lado.
- Situacional posicional: começar preso na meia e sobreviver 2 min sem ser raspado.

*Prevenção:* mantenha o joelho preso alinhado ao pé para evitar torção no LCM.`;

type ProfileGate = {
  id: string;
  is_pro: boolean;
  ai_queries_used: number;
  belt: string | null;
  stripes: number;
};

function TypingBubble() {
  return (
    <div className="flex gap-2.5">
      <CoachAvatar />
      <div className="rounded-2xl rounded-tl-sm border border-white/5 bg-surface px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-brand"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">Digitando...</span>
        </div>
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-brand/40 bg-gradient-to-br from-brand/25 to-transparent text-brand shadow-[0_0_14px_-4px_var(--color-brand,oklch(0.9_0.2_120))]">
      <Bot className="size-4.5" />
    </div>
  );
}

function CoachPage() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [usedLocal, setUsedLocal] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<ProfileGate | null>({
    queryKey: ["coach-gate"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, is_pro, ai_queries_used, belt, stripes")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileGate | null;
    },
  });

  const isPro = profile?.is_pro ?? false;
  const used = usedLocal ?? profile?.ai_queries_used ?? 0;
  const remaining = Math.max(FREE_LIMIT - used, 0);
  const locked = !isLoading && !isPro && remaining <= 0;
  const nextObjective = getNextBeltObjective(profile?.belt ?? null, profile?.stripes ?? 0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || typing || locked) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: value }]);
    setInput("");
    setTyping(true);

    if (!isPro && profile) {
      const next = used + 1;
      setUsedLocal(next);
      await supabase.from("profiles").update({ ai_queries_used: next }).eq("id", profile.id);
      queryClient.invalidateQueries({ queryKey: ["coach-gate"] });
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: MOCK_ANSWER }]);
      setTyping(false);
      inputRef.current?.focus();
    }, 2000);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-40">
      <header className="mx-auto flex w-full max-w-md items-center justify-center gap-2 px-4 pt-6">
        <h1 className="font-sans text-lg font-semibold tracking-tight">IA Coach</h1>
        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand">
          FAIXA PRETA VIRTUAL
        </span>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 pt-5">
        {!isLoading && !isPro && !locked && (
          <div className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-xs text-brand">
            <Sparkles className="size-4 shrink-0" />
            <span className="min-w-0">
              Degustação: você tem <strong>{remaining}/{FREE_LIMIT}</strong> mensagens gratuitas restantes.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={locked || isLoading}
            onClick={() =>
              void send(
                `Monte um plano de treinos e drills focado em me preparar para o meu próximo objetivo no Jiu-Jitsu: ${nextObjective}`
              )
            }
            className="press flex items-center gap-2.5 rounded-2xl border border-white/10 bg-surface p-3 text-left transition-colors hover:border-brand/40 disabled:opacity-50"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <CalendarDays className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">Plano de Treino</p>
              <p className="truncate text-[10px] text-muted-foreground">{nextObjective}</p>
            </div>
          </button>
          <Link
            to="/analysis"
            className="press flex items-center gap-2.5 rounded-2xl border border-white/10 bg-surface p-3 transition-colors hover:border-brand/40"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <BarChart3 className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">Análise</p>
              <p className="truncate text-[10px] text-muted-foreground">Seus últimos 30 dias</p>
            </div>
          </Link>
        </div>

        {messages.map((message) =>
          message.role === "assistant" ? (
            <div key={message.id} className="flex gap-2.5">
              <CoachAvatar />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/5 bg-surface px-4 py-3">
                <MarkdownText content={message.text} />
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {message.text}
              </p>
            </div>
          ),
        )}
        {typing && <TypingBubble />}
        <div ref={endRef} />
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md">
          {locked ? (
            <div className="animate-in fade-in px-4 pb-4 pt-4">
              <div className="rounded-2xl border border-brand/40 bg-gradient-to-b from-brand/10 to-transparent p-4 text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-full bg-brand/15 text-brand">
                  <Lock className="size-5" />
                </div>
                <p className="mt-2.5 text-sm font-bold">Seu treino gratuito acabou</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Assine o Flow PRO para ter seu Coach 24h por dia.
                </p>
                <Link
                  to="/pro"
                  className="press mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-brand-foreground"
                >
                  <ProBadge className="size-4" />
                  Assinar Flow PRO
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-2 pt-3">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="press min-h-9 shrink-0 rounded-full border border-white/10 bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-center gap-2 px-4 pb-3"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte ao seu coach..."
                  aria-label="Mensagem para o IA Coach"
                  className="h-11 flex-1 rounded-full border border-white/10 bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  aria-label="Enviar mensagem"
                  className="press grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-opacity disabled:opacity-40"
                >
                  <ArrowUp className="size-5" strokeWidth={2.5} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "IA Coach | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Converse com o faixa preta virtual do Flow e receba drills, táticas e planos personalizados.",
      },
      { property: "og:title", content: "IA Coach | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Converse com o faixa preta virtual do Flow e receba drills, táticas e planos personalizados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachPage,
});
