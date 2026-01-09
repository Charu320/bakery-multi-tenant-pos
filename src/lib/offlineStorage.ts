/**
 * Offline Storage Service
 * Uses IndexedDB to store orders locally when internet is unavailable
 * All orders are outlet-specific - outlet_id is mandatory
 */

const DB_NAME = "cakeOrderChronicle";
const DB_VERSION = 1;
const STORE_ORDERS = "offlineOrders";
const STORE_CUSTOMERS = "offlineCustomers";

interface OfflineOrder {
  id: string; // Local temporary ID
  outlet_id: string; // CRITICAL: Must be preserved
  order_number: string; // Generated locally
  formData: any; // Complete form data
  customerData: {
    phone_no: string;
    name: string;
    email?: string;
    address?: string;
    city?: string;
    gst_no?: string;
    isNew?: boolean; // Whether customer needs to be created
  };
  cakeImage?: {
    file: File;
    base64?: string; // Base64 for offline storage
  };
  createdAt: number; // Timestamp
  synced: boolean; // Whether this order has been synced
}

interface OfflineCustomer {
  phone_no: string;
  outlet_id: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  gst_no?: string;
}

// Initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create orders store
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        const ordersStore = db.createObjectStore(STORE_ORDERS, {
          keyPath: "id",
        });
        ordersStore.createIndex("outlet_id", "outlet_id", { unique: false });
        ordersStore.createIndex("synced", "synced", { unique: false });
        ordersStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create customers store
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        const customersStore = db.createObjectStore(STORE_CUSTOMERS, {
          keyPath: ["phone_no", "outlet_id"],
        });
        customersStore.createIndex("outlet_id", "outlet_id", { unique: false });
      }
    };
  });
};

// Convert File to Base64 for offline storage
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error("Failed to convert file to base64"));
    };
    reader.readAsDataURL(file);
  });
};

// Store an offline order
export const saveOfflineOrder = async (
  orderData: Omit<OfflineOrder, "id" | "createdAt" | "synced">
): Promise<string> => {
  const db = await openDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert cake image to base64 if present
  let cakeImageBase64: string | undefined;
  if (orderData.cakeImage?.file) {
    cakeImageBase64 = await fileToBase64(orderData.cakeImage.file);
  }

  const offlineOrder: OfflineOrder = {
    ...orderData,
    id,
    createdAt: Date.now(),
    synced: false,
    cakeImage: orderData.cakeImage
      ? {
          ...orderData.cakeImage,
          base64: cakeImageBase64,
        }
      : undefined,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ORDERS], "readwrite");
    const store = transaction.objectStore(STORE_ORDERS);
    const request = store.add(offlineOrder);

    request.onsuccess = () => {
      resolve(id);
    };

    request.onerror = () => {
      reject(new Error("Failed to save offline order"));
    };
  });
};

// Get all unsynced orders for an outlet
export const getUnsyncedOrders = async (
  outletId: string
): Promise<OfflineOrder[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ORDERS], "readonly");
    const store = transaction.objectStore(STORE_ORDERS);
    const index = store.index("outlet_id");
    const request = index.getAll(outletId);

    request.onsuccess = () => {
      const orders = request.result.filter((order) => !order.synced);
      // Sort by createdAt (oldest first)
      orders.sort((a, b) => a.createdAt - b.createdAt);
      resolve(orders);
    };

    request.onerror = () => {
      reject(new Error("Failed to get unsynced orders"));
    };
  });
};

// Get all unsynced orders (any outlet - for admin sync)
export const getAllUnsyncedOrders = async (): Promise<OfflineOrder[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ORDERS], "readonly");
    const store = transaction.objectStore(STORE_ORDERS);
    const request = store.openCursor();
    const unsyncedOrders: OfflineOrder[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const order = cursor.value as OfflineOrder;
        // Filter for unsynced orders
        if (!order.synced) {
          unsyncedOrders.push(order);
        }
        cursor.continue();
      } else {
        // All records processed, sort and return
        unsyncedOrders.sort((a, b) => a.createdAt - b.createdAt);
        resolve(unsyncedOrders);
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to get unsynced orders"));
    };
  });
};

// Mark an order as synced
export const markOrderAsSynced = async (id: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ORDERS], "readwrite");
    const store = transaction.objectStore(STORE_ORDERS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const order = getRequest.result;
      if (!order) {
        reject(new Error("Order not found"));
        return;
      }

      order.synced = true;
      const updateRequest = store.put(order);

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error("Failed to mark order as synced"));
      };
    };

    getRequest.onerror = () => {
      reject(new Error("Failed to get order"));
    };
  });
};

// Delete an offline order (after successful sync)
export const deleteOfflineOrder = async (id: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ORDERS], "readwrite");
    const store = transaction.objectStore(STORE_ORDERS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete offline order"));
    };
  });
};

// Get count of unsynced orders for an outlet
export const getUnsyncedOrdersCount = async (
  outletId: string
): Promise<number> => {
  const orders = await getUnsyncedOrders(outletId);
  return orders.length;
};

// Clear all synced orders (cleanup)
export const clearSyncedOrders = async (): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ORDERS], "readwrite");
    const store = transaction.objectStore(STORE_ORDERS);
    const index = store.index("synced");
    const request = index.openCursor(true); // Only synced orders

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to clear synced orders"));
    };
  });
};

export type { OfflineOrder, OfflineCustomer };
