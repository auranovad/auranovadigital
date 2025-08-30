/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";
import { useAuth } from "@/contexts/AuthContext";

export type TenantRole = "viewer" | "editor" | "admin" | "none";

export function useTenantRole() {
  const { user } = useAuth();
  const slug = useTenantSlug();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<TenantRole>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!user) {
        if (!alive) return;
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      setLoading(true);

      // --- OVERRIDE DEV (usa las variables locales sin consultar tenants)
      const forcedSlug  = (import.meta as any).env.VITE_FORCE_TENANT_SLUG as string | undefined;
      const forcedRole  = ((import.meta as any).env.VITE_FORCE_ROLE as TenantRole) || "admin";
      const forcedId    = (import.meta as any).env.VITE_FORCE_TENANT_ID as string | undefined;

      if (forcedId && forcedSlug && slug === forcedSlug) {
        if (!alive) return;
        setTenantId(forcedId);
        setRole(forcedRole);
        setLoading(false);
        return;
      }

      // --- Membership real (RLS)
      const { data: rows, error } = await supabase
        .from("tenant_members" as any)
        .select("tenant_id, role, tenants!inner(id, slug)")
        .eq("user_id", user.id)
        .eq("tenants.slug", slug)
        .limit(1);

      if (!alive) return;

      if (error || !rows || rows.length === 0) {
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      setTenantId(String(rows[0].tenant_id));
      setRole((rows[0].role as TenantRole) ?? "none");
      setLoading(false);
    }

    run();
    return () => { alive = false; };
  }, [slug, user?.id]);

  return { tenantId, role, loading };
}
