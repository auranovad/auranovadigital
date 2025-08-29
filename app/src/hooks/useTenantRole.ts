import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";
import { useAuth } from "@/contexts/AuthContext";

export type TenantRole = "viewer" | "editor" | "admin" | "none";
type Tenant = { id: string; slug: string; name: string };
type TenantMember = { tenant_id: string; user_id: string; role: TenantRole };

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

      const { data: tenants, error: tErr } = await supabase
        .from<Tenant>("tenants")
        .select("id, slug, name")
        .eq("slug", slug)
        .limit(1);

      if (!alive) return;

      if (tErr || !tenants?.length) {
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      const t = tenants[0];
      setTenantId(t.id);

      const { data: members, error: mErr } = await supabase
        .from<TenantMember>("tenant_members")
        .select("tenant_id, user_id, role")
        .eq("tenant_id", t.id)
        .eq("user_id", user.id)
        .limit(1);

      if (!alive) return;

      if (mErr || !members?.length) {
        setRole("none");
      } else {
        setRole(members[0].role as TenantRole);
      }
      setLoading(false);
    }

    run();
    return () => { alive = false; };
  }, [slug, user?.id]);

  return { tenantId, role, loading };
}
