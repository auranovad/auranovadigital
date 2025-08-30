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

      // Join directo a tenants por slug (RLS ya habilitado)
      const { data: rows, error } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants!inner(id, slug)")
        .eq("user_id", user.id)
        .eq("tenants.slug", slug)
        .limit(1);

      if (!alive) return;

      if (error || !rows || rows.length === 0) {
        setTenantId(null);
        setRole("none");
      } else {
        setTenantId(String(rows[0].tenant_id));
        setRole((rows[0].role as TenantRole) ?? "none");
      }

      setLoading(false);
    }

    run();
    return () => { alive = false; };
  }, [slug, user?.id]);

  return { tenantId, role, loading };
}
