import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

/* ================= TYPES ================= */

export type AppSettings = {
  id: string;
  gst_enabled: boolean;
  gst_percentage: number;
  outlet_id: string | null;
  created_at: string;
  updated_at: string;
};

/* ================= HOOK ================= */

export const useAppSettings = (outletId?: string | null) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- FETCH SETTINGS ---------- */
  const fetchSettings = async () => {
    setLoading(true);

    try {
      // If outletId is provided, try to fetch outlet-specific settings
      if (outletId) {
        let data, error;
        
        try {
          const result = await supabase
            .from("app_settings")
            .select("*")
            .eq("outlet_id", outletId)
            .maybeSingle();
          data = result.data;
          error = result.error;
        } catch (queryError: any) {
          // If query itself throws an error (e.g., column doesn't exist)
          console.warn("Query error (possibly missing column):", queryError);
          error = {
            code: "QUERY_ERROR",
            message: queryError.message || String(queryError),
            details: queryError
          };
        }

        // Check if error is due to missing column (migration not run)
        // Log the error for debugging
        if (error) {
          console.log("GST settings fetch error:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        }

        // Common error messages: "column ... does not exist", "Could not find a relationship"
        // PostgreSQL error code 42703 = undefined column
        // PostgREST might return different error formats
        const isColumnError = error && (
          error.code === "42703" ||
          error.code === "PGRST204" || // PostgREST error for missing column
          (error.message && (
            error.message.toLowerCase().includes("column") && 
            (error.message.toLowerCase().includes("outlet_id") || 
             error.message.toLowerCase().includes("does not exist") ||
             error.message.toLowerCase().includes("app_settings.outlet_id"))
          )) ||
          error.message?.includes("Could not find a relationship") ||
          (error.details && error.details.toLowerCase().includes("outlet_id"))
        );

        if (isColumnError) {
          console.warn("outlet_id column not found, falling back to global settings");
          // Fallback to global settings (old behavior)
          const { data: globalData, error: globalError } = await supabase
            .from("app_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (globalError && globalError.code !== "PGRST116") {
            console.error("GST fetch error:", globalError);
            toast.error("Failed to load GST settings");
            setLoading(false);
            return;
          }

          if (globalData) {
            setSettings(globalData);
            setLoading(false);
            return;
          }
        }

        // ❌ Real error (not "no rows" and not missing column)
        // If we get any error when trying to fetch with outlet_id, try fallback to global
        if (error && error.code !== "PGRST116" && !isColumnError) {
          // Try one more time with global settings as fallback
          console.warn("Error fetching outlet-specific settings, trying global fallback:", error);
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from("app_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (fallbackErr && fallbackErr.code !== "PGRST116") {
            console.error("GST fetch error:", error);
            toast.error("Failed to load GST settings: " + (error.message || "Unknown error"));
            setLoading(false);
            return;
          }

          if (fallbackData) {
            setSettings(fallbackData);
            setLoading(false);
            return;
          }

          console.error("GST fetch error:", error);
          toast.error("Failed to load GST settings: " + (error.message || "Unknown error"));
          setLoading(false);
          return;
        }

        // ✅ If no row exists → create default for this outlet
        if (!data) {
          const { data: inserted, error: insertError } = await supabase
            .from("app_settings")
            .insert({
              gst_enabled: true,
              gst_percentage: 5,
              outlet_id: outletId,
            })
            .select()
            .single();

          if (insertError) {
            // If insert fails due to missing column, try without outlet_id
            const isInsertColumnError = insertError.code === "42703" ||
              (insertError.message && (
                insertError.message.toLowerCase().includes("column") && 
                (insertError.message.toLowerCase().includes("outlet_id") || 
                 insertError.message.toLowerCase().includes("does not exist"))
              )) ||
              insertError.message?.includes("Could not find a relationship");

            if (isInsertColumnError) {
              const { data: fallbackInsert, error: fallbackError } = await supabase
                .from("app_settings")
                .insert({
                  gst_enabled: true,
                  gst_percentage: 5,
                })
                .select()
                .single();

              if (fallbackError) {
                console.error("GST init error:", fallbackError);
                toast.error("Failed to initialize GST settings");
                setLoading(false);
                return;
              }

              setSettings(fallbackInsert);
              setLoading(false);
              return;
            }

            console.error("GST init error:", insertError);
            toast.error("Failed to initialize GST settings: " + (insertError.message || "Unknown error"));
            setLoading(false);
            return;
          }

          setSettings(inserted);
          setLoading(false);
          return;
        }

        setSettings(data);
        setLoading(false);
        return;
      }

      // Fallback: fetch global settings (no outlet_id filter)
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("GST fetch error:", error);
        toast.error("Failed to load GST settings: " + (error.message || "Unknown error"));
        setLoading(false);
        return;
      }

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
    } catch (err: any) {
      console.error("Unexpected error fetching GST settings:", err);
      toast.error("Failed to load GST settings: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  /* ---------- INIT ---------- */
  useEffect(() => {
    fetchSettings();
  }, [outletId]);

  return {
    settings,
    loading,
    refetch: fetchSettings,
  };
};
