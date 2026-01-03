import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

export interface AdminOrder {
  id: string;
  order_number: string;
  status: string | null;
  balance: number | null;
  grand_total: number | null;
  delivery_date: string | null;
  created_at: string;

  customers?: {
    name: string;
    phone_no: string;
    city?: string | null;
  } | null;
}

/* ================= ADMIN FETCH ================= */

/**
 * Admin-only: fetch orders for ONE outlet
 */
export const fetchOrdersByOutlet = async (outletId: string) => {
  if (!outletId) {
    throw new Error("Outlet ID is required");
  }

  return supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      balance,
      grand_total,
      delivery_date,
      created_at,
      customers (
        name,
        phone_no,
        city
      )
    `
    )
    .eq("outlet_id", outletId)
    .order("created_at", { ascending: false });
};

