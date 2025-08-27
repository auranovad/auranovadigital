import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantRole, TenantRole } from '@/hooks/useTenantRole';

interface Props { children: ReactNode; minRole: TenantRole; }

const H: Record<TenantRole, number> = { viewer:1, editor:2, admin:3 };
const ok = (user: TenantRole|null, min: TenantRole) => !!user && H[user] >= H[min];

export default function RequireRole({ children, minRole }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, error } = useTenantRole();

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (error) return <div className="min-h-screen flex items-center justify-center text-destructive">{error}</div>;
  if (!ok(role, minRole)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Acceso denegado (requiere {minRole}).</div>;
  }
  return <>{children}</>;
}
