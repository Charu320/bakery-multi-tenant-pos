import { supabase } from "@/integrations/supabase/client";
import { useAdminOutlet } from "@/lib/useAdminOutlet";
import { useEffect, useState } from "react";

export function useEffectiveOutlet() {
  const [outletId, setOutletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin outlet (safe only if provider exists)
  let adminOutletId: string | null = null;
  try {
    adminOutletId = useAdminOutlet()?.selectedOutlet?.id ?? null;
  } catch {
    // ignore – not admin
  }

  useEffect(() => {
    const load = async () => {
      if (adminOutletId) {
        setOutletId(adminOutletId);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("outlet_id")
        .eq("id", user.id)
        .single();

      setOutletId(profile?.outlet_id ?? null);
      setLoading(false);
    };

    load();
  }, [adminOutletId]);

  return { outletId, loading };
}

