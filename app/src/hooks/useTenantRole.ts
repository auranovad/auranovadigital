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
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      setLoading(true);

      // ---- DEV override (solo local/QA) ----
      const forcedSlug = (import.meta as any).env.VITE_FORCE_TENANT_SLUG as string | undefined;
      const forcedRole = ((import.meta as any).env.VITE_FORCE_ROLE as TenantRole) || "admin";
      const forcedId   = (import.meta as any).env.VITE_FORCE_TENANT_ID as string | undefined;

      if (forcedId && forcedSlug && slug === forcedSlug) {
        if (!alive) return;
        setTenantId(forcedId);
        setRole(forcedRole);
        setLoading(false);
        return;
      }
      // --------------------------------------

      const { data: rows, error } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants!inner(id, slug)")
        .eq("user_id", user.id)
        .eq("tenants.slug", slug)
        .limit(1);

      if (!alive) return;

      if (error) {
        console.error("[useTenantRole] error", error);
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      if (rows && rows.length > 0) {
        const r = rows[0] as any;
        setTenantId(String(r.tenant_id));
        setRole((r.role as TenantRole) ?? "none");
      } else {
        setTenantId(null);
        setRole("none");
      }

      setLoading(false);
    }

    run();
    return () => { alive = false; };
  }, [slug, user?.id]);

  return { tenantId, role, loading };
}
