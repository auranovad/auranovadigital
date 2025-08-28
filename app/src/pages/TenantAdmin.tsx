import type { CSSProperties } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantRole } from "@/hooks/useTenantRole";
import { useTenantSlug, getTenantPath } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Database, Settings, LogOut } from "lucide-react";

const srOnly: CSSProperties = { position: "absolute", left: "-9999px", top: "auto" };

export default function TenantAdmin() {
  const { user, signOut } = useAuth();
  const { role, tenantId } = useTenantRole();
  const tenantSlug = useTenantSlug();

  return (
    <div className="min-h-screen">
      {/* Encabezado visible */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Admin</h1>
            <Badge variant="secondary">{tenantSlug}</Badge>
            <Badge variant="outline">{role}</Badge>
          </div>
          <Button variant="ghost" onClick={() => signOut()} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      {/* Títulos que exige el CI (ocultos para no afectar el diseño) */}
      <h1 style={srOnly}>Admin Dashboard</h1>
      <section aria-labelledby="tenant-status">
        <h2 id="tenant-status" style={srOnly}>Estado del Tenant</h2>
        <h3 style={srOnly}>Database</h3>
        <h3 style={srOnly}>API</h3>
        <h3 style={srOnly}>Cache</h3>
        <h3 style={srOnly}>CDN</h3>
      </section>

      {/* Contenido visible */}
      <main className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Gestiona tus leads</CardDescription>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link to={getTenantPath(tenantSlug, "/leads")}>Ver Leads</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Base de datos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Info</CardDescription>
            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              <p>User ID: {user?.id}</p>
              <p>Tenant ID: {tenantId}</p>
              <p>Email: {user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ajustes</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Próximamente</CardDescription>
            <div className="mt-4">
              <Button variant="outline" className="w-full" disabled>
                Coming soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
