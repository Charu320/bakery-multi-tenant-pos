import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUserProfile } from "@/lib/getCurrentUser";

type Role = "admin" | "manager" | "kitchen";

interface Props {
  allow: Role[];
  children: JSX.Element;
}

export default function ProtectedRoute({ allow, children }: Props) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then((profile) => {
      setRole(profile?.role ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
