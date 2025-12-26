import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar, Cake } from "lucide-react";
import { Input } from "./ui/input";


type OrderStatus = "created" | "pending" | "delivered" | "cancelled";

interface KitchenOrder {
  id: string;
  order_number: string;
  cake_size: string | null;
  flavour: string | null;
  cake_color: string | null;
  message_on_cake: string | null;
  occasion_type: string | null;
  delivery_date: string | null;
  cake_photo_url: string | null;
  status: OrderStatus;
  created_at: string;
}

const alertSound = new Audio("/sounds/new-order.wav");

export default function KitchenOrderScreen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    const channel = supabase
      .channel("kitchen-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Realtime change:", payload);

          // Play alert only for new orders
          if (payload.eventType === "INSERT") {
            alertSound.play().catch(() => {});
          }

          // Refresh kitchen orders
          fetchKitchenOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchKitchenOrders();
  }, []);

  const fetchKitchenOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        cake_size,
        flavour,
        cake_color,
        message_on_cake,
        occasion_type,
        delivery_date,
        cake_photo_url,
        status,
        created_at

      `
      )
      .in("status", ["created", "pending"])
      .order("delivery_date", { ascending: true });

    if (error) {
      toast.error("Failed to load kitchen orders");
    } else {
      setOrders(
        (data || []).map((order) => ({
          ...order,
          status: order.status as OrderStatus,
        }))
      );
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Order marked as ${newStatus}`);
      fetchKitchenOrders();
    }
  };

  const statusBadge = (status: OrderStatus) => {
    switch (status) {
      case "created":
        return <Badge className="bg-blue-500/20 text-blue-400">Created</Badge>;
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400">Preparing</Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-500/20 text-green-400">Delivered</Badge>
        );
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
    }
  };

  const isNewOrder = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return now - created < 60_000; // 1 minute highlight
  };

  const isTodayDelivery = (deliveryDate?: string | null) => {
    if (!deliveryDate) return false;

    const today = new Date();
    const delivery = new Date(deliveryDate);

    return (
      delivery.getDate() === today.getDate() &&
      delivery.getMonth() === today.getMonth() &&
      delivery.getFullYear() === today.getFullYear()
    );
  };
  const filteredOrders = orders.filter(order => {
  if (!filterDate) return true;

  if (!order.delivery_date) return false;

  return (
    format(new Date(order.delivery_date), "yyyy-MM-dd") === filterDate
  );
});


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-display text-gold">Kitchen Orders (KOT)</h1>
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-secondary border-border w-40"
        />

        <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>
          Today
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No active kitchen orders 🎉
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`bg-card transition-all shadow-card
              ${
                isNewOrder(order.created_at)
                  ? "border-gold animate-pulse bg-gold/10"
                  : "border-border"
              }`}
            >
              <CardHeader className="border-b border-border">
                <CardTitle className="flex justify-between items-center text-gold">
                  {order.order_number}
                  {statusBadge(order.status)}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Cake Image */}
                {order.cake_photo_url && (
                  <img
                    src={order.cake_photo_url}
                    alt="Cake"
                    className="w-full h-40 object-contain rounded-md border border-border"
                  />
                )}

                {/* Cake Info */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-gold" />
                    <span>
                      {order.flavour || "—"} ({order.cake_size || "—"})
                    </span>
                  </div>

                  <div className="text-muted-foreground">
                    Color: {order.cake_color || "—"}
                  </div>

                  <div className="text-muted-foreground">
                    Occasion: {order.occasion_type || "—"}
                  </div>

                  {order.delivery_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(
                        new Date(order.delivery_date),
                        "dd MMM yyyy, hh:mm a"
                      )}
                    </div>
                  )}
                </div>

                {/* Message on Cake */}
                {order.message_on_cake && (
                  <div className="bg-secondary/40 p-2 rounded-md text-sm italic">
                    “{order.message_on_cake}”
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {order.status === "created" && (
                    <Button
                      className="w-full bg-yellow-500 hover:bg-yellow-600"
                      onClick={() => updateOrderStatus(order.id, "pending")}
                    >
                      Start Preparing
                    </Button>
                  )}

                  {order.status === "pending" && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                    >
                      Mark Delivered
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
