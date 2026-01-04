import { Building2, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminOutlet } from "@/lib/useAdminOutlet";



/* ================= HEADER ================= */

const AdminDashboardHeader = () => {
  const {
    outlets,
    selectedOutlet,
    setSelectedOutlet,
    loading,
  } = useAdminOutlet();
console.log("OUTLETS:", outlets);
console.log("SELECTED OUTLET:", selectedOutlet);
  
  if (loading) {
    return (
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gold">Admin Dashboard</h1>
        <span className="text-muted-foreground text-sm">
          Loading outlets...
        </span>
      </div>
    );

  }



  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* LEFT: TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-gold">Admin Dashboard</h1>
        {selectedOutlet && (
          <p className="text-sm text-muted-foreground mt-1">
            Viewing data for{" "}
            <span className="text-gold font-medium">
              {selectedOutlet.name}
            </span>
          </p>
        )}
      </div>

      {/* RIGHT: OUTLET SWITCHER */}
      <div className="w-full sm:w-72">
        <Select
          value={selectedOutlet?.id}
          onValueChange={(outletId) => {
            const outlet = outlets.find((o) => o.id === outletId);
            if (outlet) setSelectedOutlet(outlet);
          }}
        >
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gold" />
              <SelectValue placeholder="Select outlet" />
            </div>
          </SelectTrigger>

          <SelectContent>
            {outlets.map((outlet) => (
              <SelectItem key={outlet.id} value={outlet.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{outlet.name}</span>
                  {outlet.city && (
                    <span className="text-xs text-muted-foreground">
                      {outlet.city}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AdminDashboardHeader;
