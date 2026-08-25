import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// System Prompt do IA Coach (Faixa Preta Virtual)
const SYSTEM_INSTRUCTION =
  "Você é um professor faixa preta de Jiu-Jitsu Brasileiro. Inicie com Oss. " +
  "Use termos da cultura do BJJ (rola, amassar, tapinha). Divida técnicas em passos numerados. " +
  "Adapte o nível da resposta para a faixa do usuário que está perguntando. " +
  "Foco em fundamentos e prevenção de lesões. Use Markdown";

const MODEL = "gemini-1.5-flash";

type CoachInput = {
  message: string;
  history: { role: "user" | "assistant"; text: string }[];
  belt: string | null;
  stripes: number;
};

export const askGeminiCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CoachInput) => {
    if (!data || typeof data.message !== "string" || !data.message.trim()) {
      throw new Error("Mensagem inválida");
    }
    return {
      message: data.message.slice(0, 4000),
      history: Array.isArray(data.history) ? data.history.slice(-12) : [],
      belt: data.belt ?? null,
      stripes: Number.isFinite(data.stripes) ? data.stripes : 0,
    } satisfies CoachInput;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return { text: "", error: "GEMINI_API_KEY não configurada no servidor." };
    }

    const contents = [
      ...data.history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      {
        role: "user",
        parts: [
          {
            text: `[Perfil do atleta: faixa ${data.belt ?? "Branca"}, ${data.stripes} grau(s)]\n\n${data.message}`,
          },
        ],
      },
    ];

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
          }),
        },
      );

      if (!res.ok) {
        const detail = await res.text();
        console.error("[gemini-coach]", res.status, detail);
        if (res.status === 429) {
          return { text: "", error: "O Coach está sobrecarregado agora. Tente de novo em instantes." };
        }
        return { text: "", error: "Não consegui falar com o Coach agora. Tente novamente." };
      }

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text.trim()) {
        return { text: "", error: "O Coach não retornou resposta. Reformule a pergunta." };
      }
      return { text, error: null as string | null };
    } catch (err) {
      console.error("[gemini-coach] falha", err);
      return { text: "", error: "Falha de conexão com o Coach." };
    }
  });
