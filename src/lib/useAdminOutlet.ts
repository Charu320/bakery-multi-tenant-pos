import { useAdminOutletContext } from "@/context/AdminOutletContext";

export const useAdminOutlet = () => {
  return useAdminOutletContext();
}