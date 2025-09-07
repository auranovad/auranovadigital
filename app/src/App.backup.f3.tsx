// app/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./contexts/AuthContext";
import AuthCorner from "./components/AuthCorner";

import Index from "./pages/Index";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import RequireRole from "./components/RequireRole";
import TenantAdmin from "./pages/TenantAdmin";
import TenantMembers from "@/pages/TenantMembers"; // si tu alias "@" no funciona, cambia a "./pages/TenantMembers"
import TenantLeads from "./pages/TenantLeads";
import AdminWizard from "./pages/AdminWizard";

const DEFAULT_TENANT = "auranova";
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AuthCorner />
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Rutas multi-tenant protegidas */}
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
            <Route
              path="/t/:slug/members"
              element={
                <RequireRole minRole="admin">
                  <TenantMembers />
                </RequireRole>
              }
            />

            {/* Redirecciones legacy -> multi-tenant */}
            <Route
              path="/admin/*"
              element={<Navigate to={`/t/${DEFAULT_TENANT}/admin`} replace />}
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
