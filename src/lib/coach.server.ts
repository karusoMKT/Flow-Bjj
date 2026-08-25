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

const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-pro";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Erro desconhecido ao chamar o Gemini.";
  }
}

function isModelNotFoundError(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    if (error.status === 404) return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes("404") || message.includes("not found");
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
    const history = normalizeHistory(data.history);
    const prompt =
      `[Perfil do atleta: faixa ${data.belt ?? "Branca"}, ${data.stripes} grau(s)]\n\n` +
      data.message;
    const sendMessage = async (modelName: string) => {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      const chat = model.startChat({
        history,
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      });
      return chat.sendMessage(prompt);
    };

    let result;
    try {
      result = await sendMessage(PRIMARY_MODEL);
    } catch (primaryError) {
      if (!isModelNotFoundError(primaryError)) throw primaryError;

      console.warn(
        `[gemini-coach] Modelo ${PRIMARY_MODEL} indisponível. Tentando fallback ${FALLBACK_MODEL}.`,
      );
      result = await sendMessage(FALLBACK_MODEL);
    }
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