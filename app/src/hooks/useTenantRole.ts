import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";
import { useAuth } from "@/contexts/AuthContext";

export type TenantRole = "viewer" | "editor" | "admin" | "none";

type MemberRow = {
  tenant_id: string;
  role: TenantRole;
  tenants: { id: string; slug: string };
};

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
      const env = import.meta.env as {
        VITE_FORCE_TENANT_SLUG?: string;
        VITE_FORCE_ROLE?: TenantRole;
        VITE_FORCE_TENANT_ID?: string;
      };
      const forcedSlug = env.VITE_FORCE_TENANT_SLUG;
      const forcedRole = (env.VITE_FORCE_ROLE ?? "admin") as TenantRole;
      const forcedId = env.VITE_FORCE_TENANT_ID;

      if (forcedId && forcedSlug && slug === forcedSlug) {
        if (!alive) return;
        setTenantId(forcedId);
        setRole(forcedRole);
        setLoading(false);
        return;
      }
      // --------------------------------------

      const { data, error } = await supabase
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

      const rows = (data ?? []) as MemberRow[];
      if (rows.length > 0) {
        const r = rows[0];
        setTenantId(String(r.tenant_id));
        setRole(r.role ?? "none");
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
