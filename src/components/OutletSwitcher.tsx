import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminOutlet } from "@/lib/useAdminOutlet";
import { Building2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const AdminOutletSwitcher = () => {
  const { outlets, , set, loading } =
    useAdminOutlet();

  if (loading || !) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gold" />
      <Select
        value={.id}
        onValueChange={(id) => {
          const outlet = outlets.find((o) => o.id === id);
          if (outlet) set(outlet);
        }}
      >
        <SelectTrigger className="w-56 bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {outlets.map((outlet) => (
            <SelectItem key={outlet.id} value={outlet.id}>
              {outlet.name} {outlet.city ? `(${outlet.city})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};