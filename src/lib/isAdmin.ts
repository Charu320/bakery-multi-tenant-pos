import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAILS } from "./admin";

export const isAdmin = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return false;

  return ADMIN_EMAILS.includes(user.email);
};
