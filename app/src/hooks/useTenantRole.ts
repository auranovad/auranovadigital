import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSlug } from "@/lib/tenant";

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

      const { data, error } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants!inner()")
        .eq("user_id", user.id)
        .eq("tenants.slug", slug)
        .limit(1);

      if (!alive) return;

      if (error) {
        console.error("useTenantRole error:", error);
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      const row = (data?.[0] ?? null) as { tenant_id?: string; role?: TenantRole } | null;

      if (row?.tenant_id) {
        setTenantId(String(row.tenant_id));
        setRole((row.role as TenantRole) ?? "none");
      } else {
        setTenantId(null);
        setRole("none");
      }

      setLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [slug, user?.id]);

  return { tenantId, role, loading };
}

export default useTenantRole;
