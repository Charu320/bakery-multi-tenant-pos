// lib/useUserRole.ts
import { supabase } from "@/integrations/supabase/client";

export const getUserRole = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.user_metadata?.role ?? null;
};
