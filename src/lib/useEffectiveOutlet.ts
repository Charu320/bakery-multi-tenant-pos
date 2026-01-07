import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminOutlet } from "@/context/AdminOutletContext";
import { toast } from "sonner";
export function useEffectiveOutlet() {
  const [outletId, setOutletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin outlet from context (only meaningful when admin logged in)
  const { selectedOutlet } = useAdminOutlet();

  useEffect(() => {
    const loadOutlet = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not logged in");
        setLoading(false);
        return;
      }

      // Get user role from user_profiles
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role, outlet_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        toast.error("Failed to detect outlet");
        setLoading(false);
        return;
      }

      const role = profile?.role || user.user_metadata?.role;

      // If ADMIN, use selectedOutlet from context (outlet switcher)
      if (role === "admin" && selectedOutlet?.id) {
        setOutletId(selectedOutlet.id);
        setLoading(false);
        return;
      }

      // For MANAGER/KITCHEN, always use outlet_id from user_profiles
      if (profile?.outlet_id) {
        setOutletId(profile.outlet_id);
        setLoading(false);
        return;
      }

      // Fallback: no outlet assigned
      setOutletId(null);
      setLoading(false);
    };

    loadOutlet();
  }, [selectedOutlet]);

  return {
    outletId,
    loading,
  };
}
