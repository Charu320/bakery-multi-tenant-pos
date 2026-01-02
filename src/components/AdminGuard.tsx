import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAdmin } from "@/lib/isAdmin";
import { supabase } from "@/integrations/supabase/client";

const testAuth = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log("SESSION:", data?.session);
};

testAuth();


const AdminGuard = ({ children }: { children: JSX.Element }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    isAdmin().then(setAllowed);
  }, []);

  if (allowed === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        Checking admin access…
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminGuard;
