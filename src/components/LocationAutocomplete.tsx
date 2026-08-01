import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

type NominatimPlace = { place_id: number; display_name: string };

/**
 * Autocomplete de endereços usando a API gratuita do OpenStreetMap (Nominatim).
 * Sem API key, com debounce de 400ms e dropdown em Dark Mode com hover neon.
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
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&q=${encodeURIComponent(query)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        const data = (await res.json()) as NominatimPlace[];
        setResults(Array.isArray(data) ? data : []);
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

  function select(place: NominatimPlace) {
    skipNext.current = true;
    onChange(place.display_name);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-[1.4rem] size-5 -translate-y-1/2 text-brand" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
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

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-1 shadow-2xl">
          {results.map((place) => (
            <li key={place.place_id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(place)}
                className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-brand/15 hover:text-brand"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 opacity-70" />
                <span className="line-clamp-2">{place.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
