import { forwardRef } from "react";
import { icons, Flame, Trophy, Zap } from "lucide-react";
import type { SharePayload } from "@/lib/shareService";
import { SHARE_HANDLE } from "@/lib/shareService";
import { initialsOf } from "@/components/PostCard";

const NEON = "#C0FF3E";
const BG = "#000000";
const SURFACE = "#141414";

function Icon({ name, size, color }: { name?: string | null; size: number; color: string }) {
  const Cmp = (name && (icons as Record<string, React.ElementType>)[name]) || Trophy;
  return <Cmp size={size} color={color} strokeWidth={1.6} />;
}

/**
 * Card 1080x1920 renderizado fora da tela e capturado como PNG para Stories.
 */
export const ShareStoryCard = forwardRef<HTMLDivElement, { payload: SharePayload }>(function ShareStoryCard(
  { payload },
  ref,
) {
  const athlete = payload.athlete ?? "Atleta Flow";
  const stats = payload.kind === "workout" || payload.kind === "level" ? (payload.stats ?? []) : [];

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        width: 1080,
        height: 1920,
        background: `radial-gradient(circle at 50% 22%, rgba(192,255,62,0.16), rgba(0,0,0,0) 58%), ${BG}`,
        color: "#FFFFFF",
        fontFamily: "'Archivo', 'Barlow', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "120px 88px",
        boxSizing: "border-box",
      }}
    >
      {/* Topo: marca */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 64, fontWeight: 900, fontStyle: "italic", letterSpacing: -2 }}>
          <span style={{ color: NEON }}>F</span>LOW
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 6,
            color: NEON,
            border: `2px solid ${NEON}`,
            borderRadius: 999,
            padding: "8px 18px",
          }}
        >
          JIU-JITSU
        </span>
      </div>

      {/* Miolo */}
      <div style={{ width: "100%", textAlign: "center" }}>
        {payload.kind === "achievement" && (
          <>
            <div
              style={{
                width: 340,
                height: 340,
                margin: "0 auto",
                borderRadius: 999,
                border: `4px solid rgba(192,255,62,0.45)`,
                background: "rgba(192,255,62,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={payload.iconName} size={168} color={NEON} />
            </div>
            <p style={{ marginTop: 56, fontSize: 34, fontWeight: 800, letterSpacing: 10, color: NEON }}>
              CONQUISTA DESBLOQUEADA
            </p>
            <p style={{ marginTop: 24, fontSize: 82, fontWeight: 900, lineHeight: 1.05 }}>{payload.title}</p>
            {payload.description && (
              <p style={{ marginTop: 24, fontSize: 34, color: "#A5A5A5", lineHeight: 1.4 }}>{payload.description}</p>
            )}
          </>
        )}

        {payload.kind === "level" && (
          <>
            <div
              style={{
                width: 300,
                height: 300,
                margin: "0 auto",
                borderRadius: 999,
                border: `4px solid rgba(192,255,62,0.45)`,
                background: "rgba(192,255,62,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={150} color={NEON} strokeWidth={1.6} />
            </div>
            <p style={{ marginTop: 52, fontSize: 34, fontWeight: 800, letterSpacing: 10, color: NEON }}>
              NÍVEL ATUAL
            </p>
            <p style={{ marginTop: 12, fontSize: 200, fontWeight: 900, lineHeight: 1, color: "#FFFFFF" }}>
              {payload.level}
            </p>
            <p style={{ marginTop: 8, fontSize: 38, color: "#A5A5A5" }}>{payload.xp} XP acumulado</p>

            <div
              style={{
                marginTop: 44,
                height: 28,
                width: "100%",
                borderRadius: 999,
                background: "#1E1E1E",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(3, Math.min(100, payload.percent))}%`,
                  borderRadius: 999,
                  background: NEON,
                }}
              />
            </div>
            <p style={{ marginTop: 18, fontSize: 30, color: "#A5A5A5" }}>
              Faltam {payload.xpNeeded} XP para o nível {payload.nextLevel}
            </p>
          </>
        )}

        {payload.kind === "workout" && (
          <>
            <div
              style={{
                width: 300,
                height: 300,
                margin: "0 auto",
                borderRadius: 999,
                border: `4px solid rgba(192,255,62,0.45)`,
                background: "rgba(192,255,62,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={150} color={NEON} strokeWidth={1.6} />
            </div>
            <p style={{ marginTop: 52, fontSize: 34, fontWeight: 800, letterSpacing: 10, color: NEON }}>
              MAIS UM ROLA NO TATAME
            </p>
            <p style={{ marginTop: 24, fontSize: 76, fontWeight: 900, lineHeight: 1.08 }}>{payload.title}</p>
            {payload.description && (
              <p style={{ marginTop: 24, fontSize: 34, color: "#A5A5A5", lineHeight: 1.4 }}>{payload.description}</p>
            )}
          </>
        )}

        {stats.length > 0 && (
          <div style={{ marginTop: 60, display: "flex", gap: 24, justifyContent: "center" }}>
            {stats.slice(0, 3).map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  background: SURFACE,
                  border: "2px solid rgba(255,255,255,0.07)",
                  borderRadius: 36,
                  padding: "34px 16px",
                }}
              >
                <p style={{ fontSize: 58, fontWeight: 900, color: "#FFFFFF" }}>{s.value}</p>
                <p style={{ marginTop: 10, fontSize: 26, color: "#A5A5A5" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rodapé: atleta */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {payload.avatarUrl ? (
          <img
            src={payload.avatarUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: 104, height: 104, borderRadius: 999, objectFit: "cover", border: `3px solid ${NEON}` }}
          />
        ) : (
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 999,
              background: SURFACE,
              border: `3px solid ${NEON}`,
              color: NEON,
              fontSize: 40,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {initialsOf(athlete) || "?"}
          </div>
        )}
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 44, fontWeight: 900 }}>{athlete}</p>
          <p style={{ marginTop: 6, fontSize: 28, color: "#A5A5A5" }}>
            {payload.belt ? `Faixa ${payload.belt} · ` : ""}
            {SHARE_HANDLE}
          </p>
        </div>
      </div>
    </div>
  );
});
