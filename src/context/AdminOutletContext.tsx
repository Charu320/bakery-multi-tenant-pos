import { createContext, useContext,useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { set } from "date-fns";

export type Outlet = {
  id: string;
  name: string| null;
  city: string| null;
};

type AdminOutletContextType = {
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  setSelectedOutlet: (outlet: Outlet) => void;
  loading: boolean;
};

const AdminOutletContext = createContext<AdminOutletContextType | undefined>(undefined);

export const AdminOutletProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutlets = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("outlets").select("id, name, city").order("created_at");
      
      if (error) {
        toast.error("Failed to load outlets");
        setLoading(false);
        return;
      }
      setOutlets(data || []);
      setSelectedOutlet(data?.[0] ?? null); // default to first outlet
      setLoading(false);
    };

    fetchOutlets();
  }, []);
  return (
    <AdminOutletContext.Provider
     value={{ selectedOutlet, setSelectedOutlet, outlets, loading }}>
      {children}
    </AdminOutletContext.Provider>
  );
};

export const useAdminOutletContext =()=> {
 const ctx= useContext(AdminOutletContext);
 if (!ctx) throw new Error("useAdminOutletContext must be used inside AdminOutletProvider");
 return ctx;
}

