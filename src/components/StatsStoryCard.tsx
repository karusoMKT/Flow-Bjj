import { forwardRef } from "react";
import { SHARE_HANDLE } from "@/lib/shareService";
import { initialsOf } from "@/components/PostCard";

const NEON = "#C0FF3E";
const SURFACE = "#141414";

export type StatsShareData = {
  athlete: string;
  username?: string | null;
  belt?: string | null;
  avatarUrl?: string | null;
  periodLabel: string;
  summary: { label: string; value: string }[];
  weekdays: { label: string; value: number }[];
  heatmap: { key: string; count: number; inRange: boolean }[][];
  gi: number;
  noGi: number;
};

function heatColor(count: number, inRange: boolean) {
  if (!inRange) return "transparent";
  if (count <= 0) return "#1E1E1E";
  if (count === 1) return "rgba(192,255,62,0.3)";
  if (count === 2) return "rgba(192,255,62,0.55)";
  if (count === 3) return "rgba(192,255,62,0.78)";
  return NEON;
}

/**
 * Card 1080x1920 com o resumo de estatísticas do atleta, renderizado fora da
 * tela e capturado em PNG para Stories/WhatsApp.
 */
export const StatsStoryCard = forwardRef<HTMLDivElement, { data: StatsShareData }>(function StatsStoryCard(
  { data },
  ref,
) {
  const maxWeekday = Math.max(1, ...data.weekdays.map((w) => w.value));
  const modalityTotal = data.gi + data.noGi;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        width: 1080,
        height: 1920,
        background: `radial-gradient(circle at 50% 18%, rgba(192,255,62,0.16), rgba(0,0,0,0) 58%), #000000`,
        color: "#FFFFFF",
        fontFamily: "'Archivo', 'Barlow', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "110px 80px",
        boxSizing: "border-box",
      }}
    >
      {/* Marca */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <span style={{ fontSize: 62, fontWeight: 900, fontStyle: "italic", letterSpacing: -2 }}>
          <span style={{ color: NEON }}>F</span>LOW
        </span>
        <span
          style={{
            fontSize: 19,
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

      <div style={{ width: "100%" }}>
        <p style={{ textAlign: "center", fontSize: 30, fontWeight: 800, letterSpacing: 9, color: NEON }}>
          MINHAS ESTATÍSTICAS
        </p>
        <p style={{ marginTop: 14, textAlign: "center", fontSize: 30, color: "#A5A5A5" }}>{data.periodLabel}</p>

        {/* Resumo */}
        <div style={{ marginTop: 56, display: "flex", gap: 22 }}>
          {data.summary.slice(0, 3).map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: SURFACE,
                border: "2px solid rgba(255,255,255,0.07)",
                borderRadius: 34,
                padding: "34px 14px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 56, fontWeight: 900 }}>{s.value}</p>
              <p style={{ marginTop: 10, fontSize: 24, color: "#A5A5A5" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Consistência */}
        <div
          style={{
            marginTop: 44,
            background: SURFACE,
            border: "2px solid rgba(255,255,255,0.07)",
            borderRadius: 34,
            padding: "34px 30px",
          }}
        >
          <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, color: "#A5A5A5" }}>CONSISTÊNCIA POR DIA</p>
          <div style={{ marginTop: 28, display: "flex", alignItems: "flex-end", gap: 18, height: 240 }}>
            {data.weekdays.map((w) => (
              <div key={w.label} style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    height: Math.max(8, (w.value / maxWeekday) * 190),
                    borderRadius: 14,
                    background: NEON,
                  }}
                />
                <p style={{ marginTop: 14, fontSize: 24, color: "#A5A5A5" }}>{w.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa de calor */}
        <div
          style={{
            marginTop: 32,
            background: SURFACE,
            border: "2px solid rgba(255,255,255,0.07)",
            borderRadius: 34,
            padding: "34px 30px",
          }}
        >
          <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, color: "#A5A5A5" }}>MAPA DE CALOR</p>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            {data.heatmap.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                {row.map((cell) => (
                  <div
                    key={cell.key}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: heatColor(cell.count, cell.inRange),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {modalityTotal > 0 && (
            <p style={{ marginTop: 30, fontSize: 26, color: "#A5A5A5" }}>
              Gi {Math.round((data.gi / modalityTotal) * 100)}% · No-Gi{" "}
              {Math.round((data.noGi / modalityTotal) * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* Atleta + marca d'água */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: 96, height: 96, borderRadius: 999, objectFit: "cover", border: `3px solid ${NEON}` }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              background: SURFACE,
              border: `3px solid ${NEON}`,
              color: NEON,
              fontSize: 38,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {initialsOf(data.athlete) || "?"}
          </div>
        )}
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 42, fontWeight: 900 }}>{data.athlete}</p>
          <p style={{ marginTop: 6, fontSize: 26, color: "#A5A5A5" }}>
            {data.username ? `@${data.username} · ` : ""}
            {data.belt ? `Faixa ${data.belt} · ` : ""}
            {SHARE_HANDLE}
          </p>
        </div>
      </div>
    </div>
  );
});
