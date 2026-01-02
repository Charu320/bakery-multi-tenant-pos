import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Eye, Calendar, Phone, Cake, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Label } from "@radix-ui/react-label";

export const getUserRole = async (): Promise<string | null> => {
  const { data } = await supabaseClient.auth.getUser();
  return data?.user?.user_metadata?.role ?? null;
};

interface Order {
  id: string;
  order_number: string;
  cake_size: string | null;
  flavour: string | null;
  delivery_date: string | null;

  delivery_type: string | null;
  delivery_address: string | null;
  occasion_type: string | null;
  occasion_date: string | null;
  grand_total: number | null;
  status: string | null;
  created_at: string;
  balance: number | null;
  customers: {
    name: string;
    phone_no: string;
    city: string | null;
  } | null;
}

interface OrderDetail {
  id: string;
  order_number: string;
  cake_size: string | null;
  flavour: string | null;
  cake_description: string | null;
  message_on_cake: string | null;
  cake_color: string | null;
  occasion_type: string | null;
  occasion_date: string | null;
  delivery_date: string | null;

  cake_photo_url: string | null;

  delivery_address: string | null;
  delivery_type: string | null;
  delivery_city: string | null;
  delivery_charge: number | null;
  total_amount: number | null;
  discount_percentage: number | null;
  after_discount: number | null;
  tax_percentage: number | null;
  tax_value: number | null;
  grand_total: number | null;
  cash_payment: number | null;
  credit_card_payment: number | null;

  online_payment: number | null;
  free_bill: number | null;
  balance: number | null;
  status: string | null;
  created_at: string;
  customers: {
    name: string;
    phone_no: string;
    email: string | null;
    address: string | null;
    city: string | null;
    gst_no: string | null;
  } | null;
}

interface OrderHistoryProps {
  refreshTrigger: number;
  onOrderDeleted?: () => void;
}

export const OrderHistory = ({
  refreshTrigger,
  onOrderDeleted,
}: OrderHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getUserRole().then(setRole);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabaseClient
      .from("orders")
      .select(
        `
  id,
  order_number,
  cake_size,
  flavour,
  delivery_date,

  delivery_type,
  delivery_address,
  occasion_type,
  occasion_date,
  grand_total,
  status,
  balance,
  created_at,
  customers (
    name,
    phone_no,
    city
  )
`
      )

      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

 

  const viewOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    const { data, error } = await supabaseClient
      .from("orders")
      .select(
        `
        *,
        customers (*)
      `
      )
      .eq("id", orderId)
      .single();

    if (!error && data) {
      setSelectedOrder(data);
    }
    setDetailLoading(false);
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    const { error } = await supabaseClient
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to delete order");
    } else {
      toast.success("Order deleted successfully");
      fetchOrders();
      onOrderDeleted?.();
    }
    setDeletingId(null);
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

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
// search term match
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.customers?.name?.toLowerCase().includes(searchLower) ||
      order.customers?.phone_no?.includes(searchTerm);
  
      // pending status match
    const matchesStatus = showPendingOnly
      ? order.status === "pending"
      : true;

      // date filter match
    const matchesDate = filterDate
      ? format(new Date(order.created_at), "yyyy-MM-dd") === filterDate
      : true;

      // unpaid balance match
      const matchesUnpaid = showUnpaidOnly
      ? (order as any).balance > 0 && order.status !== "cancelled"
      : true;

    return matchesSearch && matchesStatus && matchesDate && matchesUnpaid;
  });

  useEffect(() => {
  if (showPendingOnly) {
    setShowUnpaidOnly(false);
  }
}, [showPendingOnly]);


  // 🔥 PIN TODAY’S DELIVERY ORDERS ON TOP
  const todayOrders = filteredOrders.filter((order) =>
    isTodayDelivery(order.delivery_date)
  );

  const otherOrders = filteredOrders.filter(
    (order) => !isTodayDelivery(order.delivery_date)
  );

  const sortedOrders = [...todayOrders, ...otherOrders];

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-gold/20 text-gold border-gold/30";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  return (
    <>
      <Card
        className="w-full bg-card border-border"
      >
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-gold font-display text-2xl">
              Order History
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-secondary border-border w-40"
            />
            <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>
              Clear
            </Button>
            {/* <Label className="flex items-center gap-2 mb-1">
              <Input
                type="checkbox"
                checked={showPendingOnly}
                onChange={(e) => setShowPendingOnly(e.target.checked)}
                className="accent-red-600"
              />
             Pending Balance Orders
            </Label> */}

            <div className="flex items-center gap-2">
              <Button
                variant={showPendingOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPendingOnly((prev) => !prev)}
                className="border-gold text-gold hover:bg-gold/10"
              >
                Pending Only
              </Button>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showUnpaidOnly}
                onChange={(e) => setShowUnpaidOnly(e.target.checked)}
              />
              Show unpaid orders only
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium">
                      Order #
                    </th>
                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium hidden md:table-cell">
                      Cake
                    </th>
                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium hidden md:table-cell">
                      Address
                    </th>
                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium hidden lg:table-cell">
                      Occasion
                    </th>

                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium hidden lg:table-cell">
                      Delivery Type
                    </th>
                    <th className="text-left px-4 py-3 text-gold-light text-sm font-medium hidden md:table-cell">
                      Delivery Date
                    </th>
                    <th className="text-right px-4 py-3 text-gold-light text-sm font-medium">
                      Amount
                    </th>
                    <th className="text-center px-4 py-3 text-gold-light text-sm font-medium">
                      Status
                    </th>

                    <th className="text-center px-4 py-3 text-gold-light text-sm font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`border-b transition-colors ${
                        (order as any).balance > 0 &&
                        order.status !== "cancelled"
                          ? "blink-unpaid"
                          : "border-border/50 hover:bg-secondary/20"
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {order.order_number}
                          </span>

                          {/* {isTodayDelivery(order.delivery_date) && (
     <span className="bg-yellow-300 text-black text-xs font-bold px-3 py-1 rounded-sm rotate-[-2deg] shadow-md">
  📌 TODAY
</span>

    )} */}
                        </div>

                        <div className="text-muted-foreground text-xs mt-1">
                          {format(new Date(order.created_at), "dd MMM yyyy")}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-foreground">
                          {order.customers?.name}
                        </div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {order.customers?.phone_no}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Cake className="h-4 w-4 text-gold" />
                          <span className="text-foreground">
                            {order.flavour || "—"}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          {order.cake_size || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4 lg:table-cell">
                        <span className="text-gold font-semibold">
                          {order.delivery_address}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-foreground">
                          {order.occasion_type || "—"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {order.occasion_date
                            ? format(
                                new Date(order.occasion_date),
                                "dd MMM yyyy"
                              )
                            : "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-foreground">
                          {order.delivery_type || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell">
                        {order.delivery_date ? (
                          <>
                            <div className="flex items-center gap-2 text-foreground">
                              <Calendar className="h-4 w-4 text-gold" />
                              {format(
                                new Date(order.delivery_date),
                                "dd MMM yyyy, hh:mm a"
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-gold font-semibold">
                          ₹{order.grand_total?.toFixed(2) || "0.00"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge
                          variant="outline"
                          className={getStatusColor(order.status)}
                        >
                          {order.status || "pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewOrderDetails(order.id)}
                            className="text-gold hover:text-gold-light hover:bg-gold/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {role === "admin" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === order.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">
                                    Delete Order
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Are you sure you want to delete order{" "}
                                    {order.order_number}? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-secondary border-border text-foreground hover:bg-secondary/80">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent
          className={`max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border ${
            selectedOrder &&
            (selectedOrder as any).balance > 0 &&
            selectedOrder.status !== "cancelled"
              ? "blink-unpaid"
              : ""
          }`}
        >
          <DialogHeader>
            <DialogTitle className="text-gold font-display text-2xl">
              Order Details - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="text-gold-light font-medium mb-2">Customer</h4>
                  <p className="text-foreground">
                    {selectedOrder.customers?.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedOrder.customers?.phone_no}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedOrder.customers?.email}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="text-gold-light font-medium mb-2">Delivery</h4>
                  <p className="text-foreground">
                    {selectedOrder.delivery_type || "Not specified"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedOrder.delivery_address}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedOrder.delivery_date &&
                      format(
                        new Date(selectedOrder.delivery_date),
                        "dd MMM yyyy, hh:mm a"
                      )}
                  </p>
                </div>
              </div>
              {selectedOrder.cake_photo_url && (
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="text-gold-light font-medium mb-3">
                    Cake Image
                  </h4>
                  <img
                    src={selectedOrder.cake_photo_url}
                    alt="Cake"
                    className="w-full max-h-64 object-contain rounded-lg border border-border"
                  />
                </div>
              )}

              {/* Cake Details */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <h4 className="text-gold-light font-medium mb-3">
                  Cake Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <p className="text-foreground">
                      {selectedOrder.cake_size || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Flavour:</span>
                    <p className="text-foreground">
                      {selectedOrder.flavour || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Color:</span>
                    <p className="text-foreground">
                      {selectedOrder.cake_color || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Occasion:</span>
                    <p className="text-foreground">
                      {selectedOrder.occasion_type || "—"}
                    </p>
                  </div>
                </div>
                {selectedOrder.message_on_cake && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">
                      Message on Cake:
                    </span>
                    <p className="text-foreground italic">
                      "{selectedOrder.message_on_cake}"
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <h4 className="text-gold-light font-medium mb-3">
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">
                      ₹{selectedOrder.total_amount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Delivery Charge
                    </span>
                    <span className="text-foreground">
                      ₹{selectedOrder.delivery_charge?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Discount ({selectedOrder.discount_percentage}%)
                    </span>
                    <span className="text-foreground">
                      -₹
                      {(
                        ((selectedOrder.total_amount || 0) *
                          (selectedOrder.discount_percentage || 0)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax ({selectedOrder.tax_percentage}%)
                    </span>
                    <span className="text-foreground">
                      ₹{selectedOrder.tax_value?.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span className="text-gold">Grand Total</span>
                    <span className="text-gold">
                      ₹{selectedOrder.grand_total?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span
                      className={
                        selectedOrder.balance && selectedOrder.balance > 0
                          ? "text-maroon-light"
                          : "text-green-400"
                      }
                    >
                      ₹{selectedOrder.balance?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
