import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

/* ================= TYPES ================= */

export type AppSettings = {
  id: string;
  gst_enabled: boolean;
  gst_percentage: number;
  created_at: string;
  updated_at: string;
};

/* ================= HOOK ================= */

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- FETCH SETTINGS ---------- */
  const fetchSettings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .single();

    // ❌ Real error (not "no rows")
    if (error && error.code !== "PGRST116") {
      console.error("GST fetch error:", error);
      toast.error("Failed to load GST settings");
      setLoading(false);
      return;
    }

    // ✅ If no row exists → create default
    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from("app_settings")
        .insert({
          gst_enabled: true,
          gst_percentage: 5,
        })
        .select()
        .single();

      if (insertError) {
        console.error("GST init error:", insertError);
        toast.error("Failed to initialize GST settings");
        setLoading(false);
        return;
      }

      setSettings(inserted);
      setLoading(false);
      return;
    }

    setSettings(data);
    setLoading(false);
  };

  /* ---------- INIT ---------- */
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    refetch: fetchSettings,
  };
};
