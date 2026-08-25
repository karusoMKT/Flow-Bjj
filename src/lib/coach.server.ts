import { GoogleGenerativeAI } from "@google/generative-ai";

export type CoachInput = {
  message: string;
  history: { role: "user" | "assistant"; text: string }[];
  belt: string | null;
  stripes: number;
};

const SYSTEM_INSTRUCTION =
  "Você é um professor faixa preta de Jiu-Jitsu Brasileiro. Inicie com Oss. " +
  "Use termos da cultura do BJJ (rola, amassar, tapinha). Divida técnicas em passos numerados. " +
  "Adapte o nível da resposta para a faixa do usuário que está perguntando. " +
  "Foco em fundamentos e prevenção de lesões. Use Markdown";

const MODEL = "gemini-3.6-flash";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Erro desconhecido ao chamar o Gemini.";
  }
}

function normalizeHistory(history: CoachInput["history"]) {
  const normalized: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const message of history) {
    const role = message.role === "assistant" ? "model" : "user";
    if (normalized.length === 0 && role === "model") continue;

    const previous = normalized.at(-1);
    if (previous?.role === role) {
      previous.parts[0].text += `\n\n${message.text}`;
    } else {
      normalized.push({ role, parts: [{ text: message.text }] });
    }
  }

  if (normalized.at(-1)?.role === "user") normalized.pop();
  return normalized;
}

export async function generateCoachReply(data: CoachInput) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    const error = "GEMINI_API_KEY não configurada no servidor.";
    console.error("[gemini-coach]", error);
    return { text: "", error };
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    const history = normalizeHistory(data.history);
    const chat = model.startChat({
      history,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
    });
    const prompt =
      `[Perfil do atleta: faixa ${data.belt ?? "Branca"}, ${data.stripes} grau(s)]\n\n` +
      data.message;
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    if (!text.trim()) {
      return { text: "", error: "O Gemini não retornou conteúdo. Reformule a pergunta." };
    }

    return { text, error: null as string | null };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[gemini-coach] Falha detalhada ao gerar resposta:", error);
    return { text: "", error: `Erro do Gemini: ${message}` };
  }
}