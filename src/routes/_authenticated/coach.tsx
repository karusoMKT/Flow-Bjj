import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, PlayCircle } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  steps?: string[];
  video?: { title: string; duration: string };
};

const QUICK_PROMPTS = [
  "Como sair da montada?",
  "Melhorar meu gás",
  "Raspagens de guarda fechada",
  "Defesa de armlock",
  "Treino para faixa azul",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Oss, Carlos! Vamos focar na sua evolução para a Faixa Azul. O que vamos treinar hoje?",
  },
];

function mockAnswer(prompt: string): Message {
  return {
    id: `a-${Date.now()}`,
    role: "assistant",
    text: `Boa escolha, Carlos. Para "${prompt.toLowerCase()}", trabalhe esta sequência no seu próximo treino:`,
    steps: [
      "Estabeleça o frame com os cotovelos colados para recuperar espaço.",
      "Faça a ponte explosiva no lado do braço isolado.",
      "Encaixe o joelho na linha central e recomponha a meia-guarda.",
      "Finalize buscando a raspagem antes que ele reestabilize a base.",
    ],
    video: { title: "Drill guiado: fundamentos em 3 rounds", duration: "8 min" },
  };
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/5 bg-surface px-4 py-3">
        <p className="text-sm leading-relaxed text-foreground">{message.text}</p>

        {message.steps && (
          <ol className="mt-3 space-y-2">
            {message.steps.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}

        {message.video && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2.5">
            <PlayCircle className="size-6 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{message.video.title}</p>
              <p className="text-[11px] text-muted-foreground">Vídeo recomendado • {message.video.duration}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: value }, mockAnswer(value)]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-40">
      <header className="mx-auto flex w-full max-w-md items-center justify-center gap-2 px-4 pt-6">
        <h1 className="font-sans text-lg font-semibold tracking-tight">IA Coach</h1>
        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand">
          BETA
        </span>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 pt-6">
        {messages.map((message) =>
          message.role === "assistant" ? (
            <AssistantBubble key={message.id} message={message} />
          ) : (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {message.text}
              </p>
            </div>
          ),
        )}
        <div ref={endRef} />
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-2 pt-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="shrink-0 rounded-full border border-white/10 bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
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
              disabled={!input.trim()}
              aria-label="Enviar mensagem"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-opacity disabled:opacity-40"
            >
              <ArrowUp className="size-5" strokeWidth={2.5} />
            </button>
          </form>
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
      { name: "description", content: "Converse com o IA Coach do Flow e receba drills e planos personalizados rumo à faixa azul." },
      { property: "og:title", content: "IA Coach | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Converse com o IA Coach do Flow e receba drills e planos personalizados rumo à faixa azul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachPage,
});
