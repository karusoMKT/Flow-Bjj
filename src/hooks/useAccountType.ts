import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AccountType } from "@/lib/account";

export function useAccountType() {
  return useQuery({
    queryKey: ["account-type"],
    queryFn: async (): Promise<AccountType | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user?.id;
      if (!id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", id)
        .maybeSingle();
      return ((data as { account_type?: AccountType } | null)?.account_type ?? "student") as AccountType;
    },
    staleTime: 60_000,
  });
}
