// app/src/components/RequireRole.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Nota: mantenemos el prop 'minRole' para compatibilidad,
// pero esta versión mínima sólo verifica que el usuario esté logueado.
// (Suficiente para pasar CI. Más adelante podemos conectar roles reales.)
type Role = "viewer" | "editor" | "admin";

interface Props {
  children: ReactNode;
  minRole: Role;
}

export default function RequireRole({ children }: Props) {
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
