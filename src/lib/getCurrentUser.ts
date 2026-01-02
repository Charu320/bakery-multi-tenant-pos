import { supabase } from "@/integrations/supabase/client";

export const getCurrentUserProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("role, outlet_id")
    .eq("id", user.id)
    .single();

  if (error) return null;

  return {
    id: user.id,
    email: user.email,
    role: data.role as "admin" | "manager" | "kitchen",
    outlet_id: data.outlet_id as string | null,
  };
};
