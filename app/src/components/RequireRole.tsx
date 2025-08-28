// app/src/components/RequireRole.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // si prefieres, puedes usar "../contexts/AuthContext"

// Mantengo el prop `minRole` por compatibilidad, pero en esta Fase 1
// solo verificamos que el usuario esté logueado (suficiente para CI).
type Role = "viewer" | "editor" | "admin";

interface Props {
  children: ReactNode;
  minRole?: Role;
}

function RequireRole({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default RequireRole;
export { RequireRole };
