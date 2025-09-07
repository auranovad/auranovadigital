import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type TenantRole = "admin" | "editor" | "viewer" | "none";
export type UseTenantRoleResult = {
  tenantId: string | null;
  role: TenantRole;
  loading: boolean;
};

function useTenantRole(passedSlug?: string): UseTenantRoleResult {
  const { user } = useAuth();
  const { slug: routeSlug } = useParams();
  const slug = passedSlug ?? (routeSlug as string | undefined);

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<TenantRole>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      if (!user || !slug) {
        if (alive) {
          setTenantId(null);
          setRole("none");
          setLoading(false);
        }
        return;
      }

      // 1) Busca el tenant por slug
      const { data: tenants, error: tErr } = await supabase
        .from("tenants")
        .select("id, slug")
        .eq("slug", slug)
        .limit(1);

      if (tErr || !tenants || tenants.length === 0) {
        if (alive) {
          setTenantId(null);
          setRole("none");
          setLoading(false);
        }
        return;
      }

      const tid = tenants[0].id as string;

      // 2) Busca tu membership y rol
      const { data: rows, error: mErr } = await supabase
        .from("tenant_members")
        .select("role")
        .eq("tenant_id", tid)
        .eq("user_id", user.id)
        .limit(1);

      if (!alive) return;

      setTenantId(tid);
      if (mErr || !rows || rows.length === 0) {
        setRole("none");
      } else {
        setRole((rows[0].role as TenantRole) ?? "none");
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [user?.id, slug]);

  return { tenantId, role, loading };
}

export default useTenantRole;
export { useTenantRole }; // <-- named export para que funcionen los imports antiguos
