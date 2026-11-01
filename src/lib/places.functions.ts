import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GymPlace = { id: string; name: string; address: string; lat: number | null; lng: number | null };

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

async function failure(res: Response) {
  const body = await res.text();
  console.error(`Google Places Error: HTTP ${res.status}`, body);
  if (res.status === 429) return "Muitas buscas seguidas. Aguarde um instante.";
  if (res.status === 403) return "Google recusou a busca (403): chave sem permissão para Places API.";
  if (res.status === 400) return "Google rejeitou os parâmetros da busca (400).";
  if (res.status === 401) return "Credenciais do Google inválidas (401).";
  return `Não foi possível buscar academias agora (HTTP ${res.status}).`;
}

/** Busca academias no Google Places, centralizada no usuário (GPS) ou numa cidade/bairro digitado. */
export const searchGymPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { query: string; lat?: number | null; lng?: number | null; area?: string | null; country?: string | null }) => {
    const query = String(d?.query ?? "").trim().slice(0, 100);
    if (query.length < 2) throw new Error("Busca muito curta");
    const lat = typeof d?.lat === "number" && Number.isFinite(d.lat) && Math.abs(d.lat) <= 90 ? d.lat : null;
    const lng = typeof d?.lng === "number" && Number.isFinite(d.lng) && Math.abs(d.lng) <= 180 ? d.lng : null;
    const area = d?.area ? String(d.area).trim().slice(0, 100) : null;
    const country = /^[a-z]{2}$/i.test(String(d?.country ?? "")) ? String(d.country).toUpperCase() : "BR";
    return { query, lat, lng, area, country };
  })
  .handler(async ({ data }) => {
    try {
      // Read injected secrets at request time, strictly inside the server handler.
      const maps = process.env["GOOGLE_MAPS_API_KEY"];
      const lovable = process.env["LOVABLE_API_KEY"];
      if (!maps) {
        throw new Error("Busca do Google não configurada: GOOGLE_MAPS_API_KEY não está disponível no servidor.");
      }
      if (!lovable) {
        throw new Error("Busca do Google não configurada: LOVABLE_API_KEY não está disponível no servidor.");
      }
      // This is the connection key: the gateway injects Google's provider key.
      const headers = {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": maps,
      };
      let { lat, lng } = data;

      // Fallback: sem GPS, centraliza pela cidade/bairro informado (Geocoding).
      if ((lat === null || lng === null) && data.area) {
        const g = await fetch(
          `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.area)}&region=${data.country.toLowerCase()}&components=country:${data.country}&language=pt-BR`,
          { headers },
        );
        if (!g.ok) return { places: [] as GymPlace[], error: await failure(g) };
        const gj = (await g.json()) as { results?: { geometry: { location: { lat: number; lng: number } } }[] };
        const loc = gj.results?.[0]?.geometry.location;
        if (loc) ({ lat, lng } = loc);
      }

      // Busca livre (sem trava de categoria): local priorizado pela posição + filiais no país.
      const search = async (textQuery: string, biased: boolean) => {
        const body: Record<string, unknown> = { textQuery, regionCode: data.country, languageCode: "pt-BR", pageSize: 10 };
        if (biased && lat !== null && lng !== null) {
          body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 50000 } };
        }
        const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await failure(res));
        const json = (await res.json()) as {
          places?: { id: string; displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number } }[];
        };
        return json.places ?? [];
      };

      const hasBjj = /jiu|jitsu|bjj/i.test(data.query);
      const [near, national] = await Promise.allSettled([
        search(data.query, true),
        // Termos parciais/marcas: contexto "jiu-jitsu" ajuda a achar redes (Alliance, Gracie Barra, Checkmat).
        search(hasBjj ? data.query : `${data.query} jiu-jitsu`, false),
      ]);
      if (near.status === "rejected" && national.status === "rejected") {
        return { places: [] as GymPlace[], error: (near.reason as Error).message };
      }
      const seen = new Set<string>();
      const places: GymPlace[] = [];
      for (const r of [near, national]) {
        if (r.status !== "fulfilled") continue;
        for (const p of r.value) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          places.push({
            id: p.id,
            name: p.displayName?.text ?? "Academia",
            address: p.formattedAddress ?? "",
            lat: p.location?.latitude ?? null,
            lng: p.location?.longitude ?? null,
          });
        }
      }
      return { places: places.slice(0, 15), error: null as string | null };
    } catch (e) {
      console.error("Google Places Error:", e);
      return { places: [] as GymPlace[], error: (e as Error)?.message || "Não foi possível buscar academias agora." };
    }
  });
