import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Send } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "Conversa — Flow Jiu-Jitsu" },
      { name: "description", content: "Converse com seus parceiros de treino de Jiu-Jitsu no Flow." },
      { property: "og:title", content: "Conversa — Flow Jiu-Jitsu" },
      { property: "og:description", content: "Converse com seus parceiros de treino de Jiu-Jitsu no Flow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

const PEOPLE: Record<string, string> = {
  "1": "João Santos",
  "2": "Maria Almeida",
  "3": "Alliance Barra",
  "4": "Lucas Ferreira",
};

type Msg = { id: number; mine: boolean; text: string; time: string };

const INITIAL: Msg[] = [
  { id: 1, mine: false, text: "Fala! Treina hoje 19h?", time: "10:20" },
  { id: 2, mine: true, text: "Tô dentro, levo o kimono novo", time: "10:26" },
  { id: 3, mine: false, text: "Bora! Confirmado 🤙", time: "10:30" },
];

function ChatPage() {
  const { chatId } = Route.useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [text, setText] = useState("");
  const name = PEOPLE[chatId] ?? "Conversa";

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [
      ...m,
      { id: m.length + 1, mine: true, text: value, time: "agora" },
    ]);
    setText("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/5 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Voltar"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <img
          src={`https://ui-avatars.com/api/?background=1A1A1A&color=D7FF3E&bold=true&name=${encodeURIComponent(name)}`}
          alt={`Avatar de ${name}`}
          className="size-9 rounded-full"
        />
        <h1 className="text-sm font-semibold text-foreground">{name}</h1>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              m.mine
                ? "self-end bg-brand text-brand-foreground"
                : "self-start border border-white/5 bg-white/[0.04] text-foreground"
            }`}
          >
            <p>{m.text}</p>
            <span className={`mt-1 block text-[10px] ${m.mine ? "text-brand-foreground/70" : "text-muted-foreground"}`}>
              {m.time}
            </span>
          </div>
        ))}
      </main>

      <form
        onSubmit={send}
        className="sticky bottom-0 mx-auto flex w-full max-w-md items-center gap-2 border-t border-white/5 bg-background/95 px-4 py-3 backdrop-blur"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem..."
          aria-label="Mensagem"
          className="flex-1 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
