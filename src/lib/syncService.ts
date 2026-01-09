/**
 * Sync Service
 * Automatically syncs offline orders to Supabase when internet connection is restored
 * Ensures outlet_id is preserved and orders never leak between outlets
 */

import { supabase } from "@/integrations/supabase/client";
import {
  getAllUnsyncedOrders,
  markOrderAsSynced,
  deleteOfflineOrder,
  type OfflineOrder,
} from "./offlineStorage";
import { toast } from "sonner";

// Convert base64 to File
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * Sync a single offline order to Supabase
 */
const syncSingleOrder = async (offlineOrder: OfflineOrder): Promise<boolean> => {
  try {
    const { formData, customerData, cakeImage, outlet_id, order_number } =
      offlineOrder;

    // Step 1: Handle customer (find or create)
    let customerId: string;

    // Check if customer exists
    const { data: existingCustomer, error: customerCheckError } =
      await supabase
        .from("customers")
        .select("id")
        .eq("phone_no", customerData.phone_no)
        .eq("outlet_id", outlet_id) // CRITICAL: Filter by outlet_id
        .maybeSingle();

    if (customerCheckError) {
      console.error("Customer check error:", customerCheckError);
      return false;
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: createCustomerError } =
        await supabase
          .from("customers")
          .insert({
            phone_no: customerData.phone_no,
            name: customerData.name,
            email: customerData.email || null,
            address: customerData.address || null,
            city: customerData.city || null,
            gst_no: customerData.gst_no || null,
            outlet_id: outlet_id, // CRITICAL: Preserve outlet_id
          })
          .select("id")
          .single();

      if (createCustomerError) {
        console.error("Customer creation error:", createCustomerError);
        return false;
      }

      customerId = newCustomer.id;
    }

    // Step 2: Handle cake image upload if present
    let cakePhotoUrl: string | null = null;

    if (cakeImage?.base64) {
      try {
        // Convert base64 back to File
        const fileExt = cakeImage.file.name.split(".").pop() || "jpg";
        const fileName = `cake-${Date.now()}.${fileExt}`;
        const file = base64ToFile(cakeImage.base64, fileName);

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from("cake-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          // Continue without image - don't fail the whole order
        } else {
          const { data } = supabase.storage
            .from("cake-images")
            .getPublicUrl(fileName);
          cakePhotoUrl = data.publicUrl;
        }
      } catch (imageError) {
        console.error("Image processing error:", imageError);
        // Continue without image
      }
    }

    // Step 3: Check if order already exists (might have been synced already)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", order_number)
      .maybeSingle();

    if (existingOrder) {
      // Order already exists, mark as synced and delete from offline storage
      console.log(`Order ${order_number} already exists, marking as synced`);
      await markOrderAsSynced(offlineOrder.id);
      await deleteOfflineOrder(offlineOrder.id);
      return true;
    }

    // Step 4: Create order in Supabase
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        outlet_id: outlet_id, // CRITICAL: Preserve outlet_id
        order_number: order_number, // Use the offline-generated order number
        customer_id: customerId,
        cake_size: formData.cake_size || null,
        flavour: formData.flavour || null,
        cake_description: formData.cake_description || null,
        message_on_cake: formData.message_on_cake || null,
        cake_color: formData.cake_color || null,
        cake_photo_url: cakePhotoUrl,
        occasion_type: formData.occasion_type || null,
        occasion_date: formData.occasion_date || null,
        other_menu: formData.other_menu || null,
        delivery_date: formData.delivery_date,
        delivery_address: formData.delivery_address || null,
        delivery_city: formData.delivery_city || null,
        delivery_charge: Number(formData.delivery_charge) || 0,
        delivery_type: formData.delivery_type || null,
        total_amount: Number(formData.total_amount) || 0,
        tax_percentage: formData.tax_percentage || 0,
        tax_value: formData.tax_value || 0,
        discount_percentage: Number(formData.discount_percentage) || 0,
        after_discount: formData.after_discount || 0,
        grand_total: formData.grand_total || 0,
        cash_payment: Number(formData.cash_payment) || 0,
        credit_card_payment: Number(formData.credit_card_payment) || 0,
        online_payment: Number(formData.online_payment) || 0,
        free_bill: Number(formData.free_bill) || 0,
        balance: formData.balance || 0,
        status: "pending",
      })
      .select("*, customers(*)")
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      // If it's a duplicate key error, mark as synced anyway
      if (orderError.code === "23505" || orderError.message?.includes("duplicate")) {
        console.log(`Order ${order_number} duplicate detected, marking as synced`);
        await markOrderAsSynced(offlineOrder.id);
        await deleteOfflineOrder(offlineOrder.id);
        return true;
      }
      return false;
    }

    // Success! Mark as synced and delete from offline storage
    await markOrderAsSynced(offlineOrder.id);
    await deleteOfflineOrder(offlineOrder.id);

    return true;
  } catch (error) {
    console.error("Sync error:", error);
    return false;
  }
};

/**
 * Sync all unsynced offline orders
 * Returns number of successfully synced orders
 */
export const syncOfflineOrders = async (): Promise<number> => {
  try {
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("User not authenticated, skipping sync");
      return 0;
    }

    // Get all unsynced orders
    const unsyncedOrders = await getAllUnsyncedOrders();

    if (unsyncedOrders.length === 0) {
      return 0;
    }

    let successCount = 0;
    let failCount = 0;

    // Sync orders sequentially to avoid overwhelming the server
    for (const order of unsyncedOrders) {
      const success = await syncSingleOrder(order);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between syncs to avoid rate limiting
      if (unsyncedOrders.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Show toast notification
    if (successCount > 0) {
      if (failCount > 0) {
        toast.info(
          `Synced ${successCount} order(s). ${failCount} order(s) failed and will be retried.`
        );
      } else {
        toast.success(`Offline orders synced: ${successCount} order(s)`);
      }
    } else if (failCount > 0) {
      toast.error(
        `Failed to sync ${failCount} order(s). Will retry when online again.`
      );
    }

    return successCount;
  } catch (error) {
    console.error("Sync service error:", error);
    toast.error("Failed to sync offline orders. Will retry automatically.");
    return 0;
  }
};

/**
 * Start automatic sync when online
 * Call this once when app initializes
 */
export const startAutoSync = (): (() => void) => {
  let isOnline = navigator.onLine;
  let syncTimeout: NodeJS.Timeout | null = null;

  const performSync = async () => {
    if (isOnline) {
      await syncOfflineOrders();
    }
  };

  const handleOnline = () => {
    isOnline = true;
    // Wait a bit before syncing to ensure connection is stable
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      performSync();
    }, 2000); // Wait 2 seconds after coming online
  };

  const handleOffline = () => {
    isOnline = false;
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
  };

  // Initial sync if already online
  if (isOnline) {
    syncTimeout = setTimeout(() => {
      performSync();
    }, 3000); // Initial sync after 3 seconds
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Periodic sync check (every 5 minutes if online)
  const periodicSync = setInterval(() => {
    if (navigator.onLine) {
      performSync();
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    clearInterval(periodicSync);
  };
};
