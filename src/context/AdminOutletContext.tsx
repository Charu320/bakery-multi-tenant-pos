import { createContext, useContext,useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Outlet = {
  id: string;
  name: string| null;
  city: string| null;
  address: string | null;
  gst_no: string | null;
  phone_no: string | null;
};

type AdminOutletContextType = {
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  setOutlet: (outlet: Outlet|null) => void;
  loading: boolean;
};

const AdminOutletContext = createContext<AdminOutletContextType | undefined>(undefined);

export const AdminOutletProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // 🔐 Check logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login first");
        setLoading(false);
        return;
      }
    
    // Get role and outlet_id from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, outlet_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      toast.error("Failed to load user profile");
      setLoading(false);
      return;
    }

    const role = profile?.role || user.user_metadata?.role;
    const userOutletId = profile?.outlet_id;
    
    // 🔥 Fetch outlets only for ADMIN (no restriction)
    const { data, error } = await supabase
      .from("outlets")
      .select("id, name, city, address, gst_no, phone_no")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load outlets");
      console.error("Outlet fetch error:", error);
      setLoading(false);
      return;
    }

    setOutlets(data || []);
    
    //👉 Default logic by ROLE
    if (role === "admin") {
      setSelectedOutlet(data?.[0] ?? null);
    } else {
      // For MANAGER / KITCHEN → force their own outlet
      const outlet = (data || []).find((o) => o.id === userOutletId);
      setSelectedOutlet(outlet ?? null);
    }

      setLoading(false);
    };

    init();
  }, []);
 
  return (
    <AdminOutletContext.Provider
     value={
      {
  outlets,
        selectedOutlet,
        setOutlet: setSelectedOutlet,
        loading,
      }
     }>
      {children}
    </AdminOutletContext.Provider>
  );
};

export const useAdminOutlet = () => {
 const ctx= useContext(AdminOutletContext);
 if (!ctx)
   throw new Error
  ("useAdminOutlet must be used inside AdminOutletProvider");
 return ctx;
};

