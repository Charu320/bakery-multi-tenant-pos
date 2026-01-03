import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import AdminDashboardHeader from "./AdminDashboardHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  BarChart3,
  Percent,
  Settings,
  ChefHat,
  ClipboardList,
  IndianRupee,
} from "lucide-react";

import KitchenOrderScreen from "./KitchenOrderScreen";
import { OrderHistory } from "./OrderHistory";
import { Database } from "@/integrations/supabase/types";
import { useAdminOutlet } from "@/lib/useAdminOutlet";
import { AdminOutletProvider } from "@/context/AdminOutletContext";
/* ================= TYPES ================= */

type AppSettings = {
  key: string;
  id: string;
  value: string;
  updated_at: string;
  gst_enabled: boolean;
  gst_percentage: number;
};

type SalesSummary = {
  totalSales: number;
  totalOrders: number;
  gstCollected: number;
};

type SalesData = {
  period: string;
  totalSales: number;
  totalOrders: number;
  gstCollected: number;
};

type Orders={
  id:string;
  outlet_id:string;
  created_at:string;
  updated_at:string;
  

}

type TimePeriod = "daily" | "weekly" | "quarterly" | "yearly";

/* ================= COMPONENT ================= */

const AdminDashboard = () => {
  const [role, setRole] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sales, setSales] = useState<SalesSummary>({
    totalSales: 0,
    totalOrders: 0,
    gstCollected: 0,
  });
  const [salesByPeriod, setSalesByPeriod] = useState<SalesData[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("daily");
  const [loading, setLoading] = useState(false);

// -- AUTH CHECK ---------- */


  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login");
        window.location.replace("/login");
        return;
      }

      const userRole = user.user_metadata?.role;

      if (userRole !== "admin") {
        toast.error("Admin access only");
        window.location.replace("/");
        return;
      }

      setRole("admin");
    };

    checkAuth();
  }, []);

  /* ---------- FETCH APP SETTINGS ---------- */

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to load GST settings");
      return;
    }

    setSettings(data as AppSettings);
  };

  /* ---------- FETCH SALES REPORT ---------- */

  const fetchSalesReport = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("grand_total, tax_value")
      .eq("status", "delivered");

    if (error) {
      toast.error("Failed to load sales report");
      return;
    }

    const totalSales = data.reduce(
      (sum, o) => sum + (o.grand_total || 0),
      0
    );
    const gstCollected = data.reduce(
      (sum, o) => sum + (o.tax_value || 0),
      0
    );

    setSales({
      totalSales,
      gstCollected,
      totalOrders: data.length,
    });
  };

  /* ---------- FETCH SALES BY TIME PERIOD ---------- */

  const fetchSalesByPeriod = async (period: TimePeriod) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("grand_total, tax_value, delivery_date")
      .eq("status", "delivered")
      .order("delivery_date", { ascending: true });

    if (error) {
      toast.error("Failed to load sales data");
      setLoading(false);
      return;
    }

    // Group data by selected time period
    const grouped = groupSalesByPeriod(data, period);
    setSalesByPeriod(grouped);
    setLoading(false);
  };

  /* ---------- GROUP SALES BY TIME PERIOD ---------- */

  const groupSalesByPeriod = (
    orders: any[],
    period: TimePeriod
  ): SalesData[] => {
    const grouped: { [key: string]: SalesData } = {};

    orders.forEach((order) => {
      const date = order.delivery_date ? new Date(order.delivery_date) : null;
      if (!date) return;

      let periodKey = "";
      let displayPeriod = "";

      switch (period) {
        case "daily":
          periodKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          displayPeriod = new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(date);
          break;

        case "weekly":
          const weekStart = getWeekStart(date);
          periodKey = weekStart.toISOString().split("T")[0];
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          displayPeriod = `Week of ${new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(weekStart)}`;
          break;

        case "quarterly":
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          const year = date.getFullYear();
          periodKey = `${year}-Q${quarter}`;
          displayPeriod = `Q${quarter} ${year}`;
          break;

        case "yearly":
          const yearVal = date.getFullYear();
          periodKey = `${yearVal}`;
          displayPeriod = `${yearVal}`;
          break;
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          period: displayPeriod,
          totalSales: 0,
          totalOrders: 0,
          gstCollected: 0,
        };
      }

      grouped[periodKey].totalSales += order.grand_total || 0;
      grouped[periodKey].gstCollected += order.tax_value || 0;
      grouped[periodKey].totalOrders += 1;
    });

    return Object.values(grouped).sort((a, b) => {
      // Sort by period for daily/weekly (string comparison works), quarterly/yearly
      if (period === "daily" || period === "weekly") {
        return a.period.localeCompare(b.period);
      }
      return a.period.localeCompare(b.period);
    });
  };

  /* ---------- GET WEEK START DATE ---------- */

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start from Monday
    return new Date(d.setDate(diff));
  };

  // 
  

  /* ---------- UPDATE GST SETTINGS (SAFE) ---------- */

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings?.id) {
      toast.error("Settings not loaded");
      return;
    };
    setLoading(true);
    const { error } = await supabase
      .from("app_settings")
      .update(updates)
      .eq("id", settings.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings updated");
      setSettings({...settings, ...updates} as AppSettings);
    }
  };

  /* ---------- INIT ---------- */

  useEffect(() => {
    if (role === "admin") {
      fetchSettings();
      fetchSalesReport();
      fetchSalesByPeriod(timePeriod);
    }
  }, [role]);

  /* ---------- REFETCH ON PERIOD CHANGE ---------- */

  useEffect(() => {
    if (role === "admin") {
      fetchSalesByPeriod(timePeriod);
    }
  }, [timePeriod]);

  /* ---------- BLOCK RENDER UNTIL AUTH ---------- */

  if (role !== "admin") {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Checking admin access...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <AdminOutletProvider>
    <div className="p-6 space-y-6">
     <AdminDashboardHeader/>


      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="sales">
            <BarChart3 className="h-4 w-4 mr-2" /> Sales
          </TabsTrigger>
          <TabsTrigger value="gst">
            <Settings className="h-4 w-4 mr-2" /> GST
          </TabsTrigger>
          <TabsTrigger value="kitchen">
            <ChefHat className="h-4 w-4 mr-2" /> Kitchen
          </TabsTrigger>
          <TabsTrigger value="history">
            <ClipboardList className="h-4 w-4 mr-2" /> Orders
          </TabsTrigger>
        </TabsList>

        {/* ---------- SALES ---------- */}
        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold flex gap-2">
                <IndianRupee /> {sales.totalSales.toFixed(2)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Delivered</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {sales.totalOrders}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GST Collected</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold flex gap-2">
                <Percent /> {sales.gstCollected.toFixed(2)}
              </CardContent>
            </Card>
          </div>

          {/* ---------- SALES BY PERIOD ---------- */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Report</CardTitle>
                <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading sales data...
                </div>
              ) : salesByPeriod.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">GST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByPeriod.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.period}</TableCell>
                        <TableCell className="text-right">{item.totalOrders}</TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {item.totalSales.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {item.gstCollected.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- GST ---------- */}
        <TabsContent value="gst">
          {!settings ? (
            <div className="mt-6 text-muted-foreground">
              Loading GST settings...
            </div>
          ) : (
            <Card className="mt-6 max-w-xl">
              <CardHeader>
                <CardTitle>GST Configuration</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Enable GST</span>
                  <Switch
                    checked={settings.gst_enabled}
                    onCheckedChange={(checked) =>
                      updateSettings({ gst_enabled: checked })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <span className="font-medium">GST Percentage</span>
                  <Select
                    value={String(settings.gst_percentage)}
                    onValueChange={(v) =>
                      updateSettings({ gst_percentage: Number(v) })
                    }
                    disabled={!settings.gst_enabled || loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------- KITCHEN ---------- */}
        <TabsContent value="kitchen">
          <KitchenOrderScreen />
        </TabsContent>

        {/* ---------- HISTORY ---------- */}
        <TabsContent value="history">
          <OrderHistory refreshTrigger={0} />
        </TabsContent>
      </Tabs>
     
    </div>
    </AdminOutletProvider>
  );
};

export default AdminDashboard;
