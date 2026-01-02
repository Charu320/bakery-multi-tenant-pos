import { createContext, useContext, useState } from "react";

type Outlet = {
  id: string;
  name: string;
};

type AdminOutletContextType = {
  selectedOutlet: Outlet | null;
  setSelectedOutlet: (outlet: Outlet) => void;
};

const AdminOutletContext = createContext<AdminOutletContextType | null>(null);

export const AdminOutletProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  return (
    <AdminOutletContext.Provider value={{ selectedOutlet, setSelectedOutlet }}>
      {children}
    </AdminOutletContext.Provider>
  );
};

export const useAdminOutlet = () => {
  const ctx = useContext(AdminOutletContext);
  if (!ctx) throw new Error("useAdminOutlet must be used inside AdminOutletProvider");
  return ctx;
};
