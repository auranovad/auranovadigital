import { useAuth } from '@/contexts/AuthContext';
import { useTenantRole } from '@/hooks/useTenantRole';
import { useTenantSlug, getTenantPath } from '@/lib/tenant';
import { Link } from 'react-router-dom';

export default function TenantAdmin() {
  const { user, signOut } = useAuth();
  const { role, tenantId } = useTenantRole();
  const slug = useTenantSlug();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Admin</h1>
            <span className="text-xs border rounded px-2 py-1">{slug}</span>
            <span className="text-xs border rounded px-2 py-1">{role}</span>
          </div>
          <button className="underline" onClick={()=>signOut()}>Cerrar sesión</button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium">Leads</h2>
          </div>
          <p className="text-sm text-gray-500">Gestiona tus leads</p>
          <div className="mt-4">
            <Link className="block text-center rounded bg-black text-white py-2"
              to={getTenantPath(slug, '/leads')}
            >
              Ver Leads
            </Link>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium">Miembros</h2>
          </div>
          <p className="text-sm text-gray-500">Administra miembros y roles</p>
          <div className="mt-4">
            <Link className="block text-center rounded bg-black text-white py-2"
              to={getTenantPath(slug, '/members')}
            >
              Ver Miembros
            </Link>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium">Base de datos</h2>
          </div>
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <p>User ID: {user?.id}</p>
            <p>Tenant ID: {tenantId}</p>
            <p>Email: {user?.email}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
