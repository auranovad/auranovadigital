// app/src/App.tsx
import AuthCorner from "@/components/AuthCorner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import AdminWizard from "@/pages/AdminWizard";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";

// Multi-tenant (usa import por defecto)
import RequireRole from "@/components/RequireRole";
import TenantAdmin from "@/pages/TenantAdmin";
import TenantLeads from "@/pages/TenantLeads";
import { DEFAULT_TENANT } from "@/lib/tenant"; // <— mejor que hardcodear

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Si NO tienes AuthProvider en main.tsx, descomenta y úsalo aquí
      <AuthProvider>
      */}
      <BrowserRouter>
        <AuthCorner />
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Canónicas multi-tenant */}
          <Route
            path="/t/:slug/admin"
            element={
              <RequireRole minRole="admin">
                <TenantAdmin />
              </RequireRole>
            }
          />
          <Route
            path="/t/:slug/leads"
            element={
              <RequireRole minRole="viewer">
                <TenantLeads />
              </RequireRole>
            }
          />

          {/* Legacy -> multi-tenant */}
          {/* Mejor (B): /admin RENDERIZA el Admin multi-tenant directamente */}
          <Route
            path="/admin/*"
            element={
              <RequireRole minRole="admin">
                <TenantAdmin />
              </RequireRole>
            }
          />
          <Route
            path="/leads/*"
            element={<Navigate to={`/t/${DEFAULT_TENANT}/leads`} replace />}
          />

          {/* Wizard (si lo usas aparte del Admin) */}
          <Route
            path="/admin/wizard/*"
            element={
              <ProtectedRoute>
                <AdminWizard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      {/* Si abriste AuthProvider arriba, ciérralo aquí
      </AuthProvider>
      */}
    </QueryClientProvider>
  );
}
