/**
 * shareService — gera imagens no formato Stories (1080x1920) a partir de um
 * nó do DOM e dispara o compartilhamento nativo (Web Share API) com fallback
 * para download do PNG.
 */

export const SHARE_HANDLE = "@goflow.bjj";

export type SharePayload =
  | {
      kind: "achievement";
      title: string;
      description?: string | null;
      iconName?: string | null;
      athlete?: string | null;
      belt?: string | null;
      avatarUrl?: string | null;
    }
  | {
      kind: "workout";
      title: string;
      description?: string | null;
      stats?: { label: string; value: string }[];
      athlete?: string | null;
      belt?: string | null;
      avatarUrl?: string | null;
    }
  | {
      kind: "level";
      level: number;
      xp: number;
      percent: number;
      nextLevel: number;
      xpNeeded: number;
      stats?: { label: string; value: string }[];
      athlete?: string | null;
      belt?: string | null;
      avatarUrl?: string | null;
    };

export function shareTextFor(payload: SharePayload): string {
  switch (payload.kind) {
    case "achievement":
      return `Desbloqueei "${payload.title}" no tatame! Acompanhe meu treino no Flow. ${SHARE_HANDLE}`;
    case "level":
      return `Acabei de subir para o Nível ${payload.level} no tatame! Acompanhe meu treino no Flow. ${SHARE_HANDLE}`;
    default:
      return `Mais um treino registrado no tatame! Acompanhe meu treino no Flow. ${SHARE_HANDLE}`;
  }
}

function fileNameFor(payload: SharePayload): string {
  const slug =
    payload.kind === "level" ? `nivel-${payload.level}` : payload.kind === "achievement" ? "conquista" : "treino";
  return `flow-${slug}.png`;
}

/** Converte um nó do DOM em um PNG (Blob). Retorna null se falhar. */
export async function nodeToPngBlob(node: HTMLElement): Promise<Blob | null> {
  try {
    const { default: html2canvas } = await import("html2canvas-pro");
    const canvas = await html2canvas(node, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export type ShareResult = "shared" | "downloaded" | "text" | "cancelled" | "failed";

/**
 * Compartilha o card renderizado: tenta imagem + Web Share API,
 * depois texto nativo, e por fim download do PNG.
 */
export async function shareNode(node: HTMLElement | null, payload: SharePayload): Promise<ShareResult> {
  const text = shareTextFor(payload);
  const url = typeof window !== "undefined" ? window.location.origin : undefined;
  const blob = node ? await nodeToPngBlob(node) : null;

  if (blob && typeof navigator !== "undefined" && "share" in navigator) {
    const file = new File([blob], fileNameFor(payload), { type: "image/png" });
    const canFiles = navigator.canShare?.({ files: [file] }) ?? false;
    if (canFiles) {
      try {
        await navigator.share({ files: [file], text, title: "Flow" });
        return "shared";
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return "cancelled";
      }
    }
  }

  if (typeof navigator !== "undefined" && "share" in navigator && !blob) {
    try {
      await navigator.share({ text, title: "Flow", url });
      return "text";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
    }
  }

  if (blob) {
    downloadBlob(blob, fileNameFor(payload));
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard opcional */
    }
    return "downloaded";
  }

  return "failed";
}
