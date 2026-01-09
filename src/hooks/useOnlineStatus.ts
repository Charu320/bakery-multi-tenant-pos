import { useState, useEffect } from "react";

/**
 * Hook to detect online/offline status
 * Uses Navigator.onLine API and online/offline events
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current status
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true; // Assume online if navigator is not available
  });

  useEffect(() => {
    // Update state when online/offline events fire
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
