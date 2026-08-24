import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Place = { id: string; label: string; custom?: boolean };

type MapboxFeature = { id: string; place_name: string };

/** Token público do Mapbox (VITE_MAPBOX_TOKEN ou o token do connector Mapbox). */
const MAPBOX_TOKEN: string =
  (import.meta.env['VITE_MAPBOX_TOKEN'] as string | undefined) ??
  (import.meta.env['VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN'] as string | undefined) ??
  "";

/**
 * Autocomplete de endereços/academias: busca locais cadastrados pela comunidade
 * (custom_locations) + Mapbox Search, com opção de cadastrar um novo local.
 */
export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Buscar local...",
  ariaLabel = "Localização",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const [custom, mapbox] = await Promise.all([
          searchCustomLocations(query),
          searchMapbox(query, controller.signal),
        ]);
        setResults([...custom, ...mapbox]);
        setOpen(true);
      } catch {
        /* busca cancelada ou offline */
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  function select(label: string) {
    skipNext.current = true;
    onChange(label);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-[1.4rem] size-5 -translate-y-1/2 text-brand" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // Texto livre: mantém exatamente o que foi digitado
            e.preventDefault();
            skipNext.current = true;
            setOpen(false);
            setResults([]);
            e.currentTarget.blur();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-label={ariaLabel}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/5 bg-white/[0.04] py-4 pl-12 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
      />
      {loading && (
        <Loader2 className="absolute right-4 top-[1.4rem] size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {open && (
        <ul className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-1 shadow-2xl">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(place.label)}
                className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-brand/15 hover:text-brand"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 opacity-70" />
                <span className="line-clamp-2 flex-1">{place.label}</span>
                {place.custom && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                    Comunidade
                  </span>
                )}
              </button>
            </li>
          ))}
          {results.length === 0 && !loading && (
            <li className="px-3 py-2.5 text-xs text-muted-foreground">
              {value.trim().length < 3 ? "Digite ao menos 3 letras para buscar." : "Nenhum local encontrado."}
            </li>
          )}
          <li className="sticky bottom-0 border-t border-white/10 bg-[#121212] pt-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-brand transition-colors hover:bg-brand/15"
            >
              <Plus className="size-4 shrink-0" />
              Adicionar nova academia/local
            </button>
          </li>
        </ul>
      )}

      {creating && (
        <NewLocationModal
          initialName={value.trim()}
          onClose={() => setCreating(false)}
          onCreated={(label) => {
            setCreating(false);
            select(label);
          }}
        />
      )}
    </div>
  );
}

async function searchCustomLocations(query: string): Promise<Place[]> {
  const { data } = await supabase
    .from("custom_locations")
    .select("id, name, address")
    .ilike("name", `%${query}%`)
    .limit(5);
  return (data ?? []).map((row) => ({
    id: `custom-${row.id}`,
    label: row.address ? `${row.name} — ${row.address}` : row.name,
    custom: true,
  }));
}

async function searchMapbox(query: string, signal: AbortSignal): Promise<Place[]> {
  if (!MAPBOX_TOKEN) return [];
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    country: "br",
    language: "pt",
    limit: "6",
    types: "poi,address,place,locality,neighborhood",
    autocomplete: "true",
  });
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
    { signal, headers: { Accept: "application/json" } },
  );
  const data = (await res.json()) as { features?: MapboxFeature[] };
  return (data.features ?? []).map((f) => ({ id: f.id, label: f.place_name }));
}

/** Modal simples para cadastrar um novo local da comunidade. */
function NewLocationModal({
  initialName,
  onClose,
  onCreated,
}: {
  initialName: string;
  onClose: () => void;
  onCreated: (label: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Faça login para cadastrar um local");
      const { error } = await supabase
        .from("custom_locations")
        .insert({ name: name.trim(), address: address.trim() || null, created_by: uid });
      if (error) throw error;
      toast.success("Local cadastrado! 🥋");
      onCreated(address.trim() ? `${name.trim()} — ${address.trim()}` : name.trim());
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível salvar o local");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 animate-fade-in backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar novo local"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121212] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black uppercase tracking-wide text-foreground">Novo local</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Cadastre uma academia ou local que ainda não aparece na busca.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do local (ex: Fight Sports Ilhéus)"
            aria-label="Nome do local"
            className="h-12 w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Endereço/Referência (ex: Rua Rotary)"
            aria-label="Endereço ou referência"
            className="h-12 w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!name.trim() || saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-xs font-black uppercase tracking-wider text-brand-foreground transition-transform active:scale-95 disabled:opacity-40"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Salvar local
          </button>
        </div>
      </div>
    </div>
  );
}
