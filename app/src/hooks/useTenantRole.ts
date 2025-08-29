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

      // Quitar genéricos: .from("tenants") y castear
      const { data: tenantData, error: tErr } = await supabase
        .from("tenants")
        .select("id, slug, name")
        .eq("slug", slug)
        .limit(1);

      if (!alive) return;

      const tenants = (tenantData ?? []) as Tenant[];
      if (tErr || tenants.length === 0) {
        setTenantId(null);
        setRole("none");
        setLoading(false);
        return;
      }

      const t = tenants[0];
      setTenantId(t.id);

      // Quitar genéricos: .from("tenant_members") y castear
      const { data: memberData, error: mErr } = await supabase
        .from("tenant_members")
        .select("tenant_id, user_id, role")
        .eq("tenant_id", t.id)
        .eq("user_id", user.id)
        .limit(1);

      if (!alive) return;

      const members = (memberData ?? []) as TenantMember[];
      if (mErr || members.length === 0) {
        setRole("none");
      } else {
        setRole(members[0].role as TenantRole);
      }
      setLoading(false);
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id]); // mantenemos dependencias prácticas para evitar el warning

  return { tenantId, role, loading };
}
