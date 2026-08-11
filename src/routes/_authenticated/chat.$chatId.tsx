import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  avatarFor,
  clockTime,
  displayName,
  fetchConversationPeer,
  fetchMessages,
  markConversationRead,
  sendMessage,
  useCurrentUserId,
} from "@/lib/inbox";

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

function ChatPage() {
  const { chatId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: userId } = useCurrentUserId();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId),
  });

  const { data: peer } = useQuery({
    queryKey: ["conversation-peer", chatId, userId],
    queryFn: () => fetchConversationPeer(chatId, userId!),
    enabled: Boolean(userId),
  });

  // Realtime: novas mensagens desta conversa aparecem instantaneamente.
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${chatId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!userId || messages.length === 0) return;
    void markConversationRead(chatId).then(() =>
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    );
  }, [chatId, userId, messages.length, queryClient]);

  const name = displayName(peer);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(chatId, value);
      await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error) {
      setText(value);
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem");
    } finally {
      setSending(false);
    }
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
          src={peer?.avatar_url || avatarFor(name)}
          alt={`Avatar de ${name}`}
          className="size-9 rounded-full object-cover"
        />
        <h1 className="text-sm font-semibold text-foreground">{name}</h1>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 py-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando conversa...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Mande um oss!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div
                key={m.id}
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "self-end bg-brand text-brand-foreground"
                    : "self-start border border-white/5 bg-white/[0.04] text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <span
                  className={`mt-1 block text-[10px] ${mine ? "text-brand-foreground/70" : "text-muted-foreground"}`}
                >
                  {clockTime(m.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
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
          disabled={sending}
          aria-label="Enviar"
          className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground disabled:opacity-60"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
