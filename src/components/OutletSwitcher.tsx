import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminOutlet } from "@/context/AdminOutletContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const OutletSwitcher = () => {
  const { selectedOutlet, setSelectedOutlet } = useAdminOutlet();
  const [outlets, setOutlets] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("outlets").select("*").then(({ data }) => {
      if (data) {
        setOutlets(data);
        if (!selectedOutlet) setSelectedOutlet(data[0]); // default
      }
    });
  }, []);

  return (
    <Select
      value={selectedOutlet?.id}
      onValueChange={(id) => {
        const outlet = outlets.find(o => o.id === id);
        if (outlet) setSelectedOutlet(outlet);
      }}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select Outlet" />
      </SelectTrigger>
      <SelectContent>
        {outlets.map(outlet => (
          <SelectItem key={outlet.id} value={outlet.id}>
            {outlet.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
