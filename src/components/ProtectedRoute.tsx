import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUserProfile } from "@/lib/getCurrentUser";

type Role = "admin" | "manager" | "kitchen";

interface Props {
  allow: Role[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allow, children }: Props) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    getCurrentUserProfile()
      .then((profile) => {
        if (profile) {
          setHasUser(true);
          setRole(profile.role as Role | null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  // ❌ Not logged in
  if (!hasUser) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Logged in but role not allowed
  if (!role || !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ Allowed
  return <>{children}</>;
}

