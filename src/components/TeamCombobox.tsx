import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_TEAMS = [
  "Alliance",
  "Gracie Barra",
  "Gracie Humaitá",
  "Checkmat",
  "Atos Jiu-Jitsu",
  "Fight Sports",
  "GFTeam",
  "Nova União",
  "Dream Art",
  "Brasa CTA",
  "BTT — Brazilian Top Team",
  "CICERO COSTHA",
  "Carlson Gracie",
  "Ribeiro Jiu-Jitsu",
  "Almeida Jiu-Jitsu",
  "PSLPB Cicero Costha",
  "Soul Fighters",
  "Zenith BJJ",
  "Unity Jiu-Jitsu",
  "Art of Jiu-Jitsu",
];

export function TeamCombobox({
  value,
  onChange,
  id = "team",
  placeholder = "Alliance",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<string[]>(FALLBACK_TEAMS);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("gyms").select("name").limit(500);
      if (!active) return;
      const names = (data ?? []).map((g) => g.name).filter(Boolean) as string[];
      if (names.length) {
        setTeams(Array.from(new Set([...names, ...FALLBACK_TEAMS])).sort((a, b) => a.localeCompare(b)));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const query = value.trim().toLowerCase();
  const matches = useMemo(
    () => (query ? teams.filter((t) => t.toLowerCase().includes(query)) : teams).slice(0, 8),
    [teams, query],
  );
  const canCreate = query.length > 1 && !teams.some((t) => t.toLowerCase() === query);

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={className}
        placeholder={placeholder}
      />
      {open && (matches.length > 0 || canCreate) && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-surface-2 py-1 shadow-lg">
          {matches.map((t) => (
            <li key={t}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-white/5"
              >
                {t}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen(false)}
                className="w-full px-3 py-2 text-left text-sm font-semibold text-brand transition-colors hover:bg-white/5"
              >
                Adicionar “{value.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
