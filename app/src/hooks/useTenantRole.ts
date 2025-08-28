import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSlug } from '@/lib/tenant';

export type TenantRole = 'admin' | 'editor' | 'viewer';

interface UseTenantRoleReturn {
  tenantId: string | null;
  role: TenantRole | null;
  loading: boolean;
  error: string | null;
}

export const useTenantRole = (): UseTenantRoleReturn => {
  const { user } = useAuth();
  const tenantSlug = useTenantSlug();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<TenantRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user || !tenantSlug) {
        setTenantId(null);
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Busca el tenant por slug o por name
        const { data: tenant, error: te } = await supabase
          .from('tenants')
          .select('id, slug, name')
          .or(`slug.eq.${tenantSlug},name.eq.${tenantSlug}`)
          .maybeSingle();

        if (te || !tenant) {
          setError(`Tenant no encontrado: ${tenantSlug}`);
          setTenantId(null);
          setRole(null);
          return;
        }
        setTenantId(tenant.id);

        // Busca el membership del usuario en ese tenant
        const { data: membership, error: me } = await supabase
          .from('tenant_members')
          .select('role')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (me || !membership) {
          setError('No eres miembro de este tenant');
          setRole(null);
        } else {
          setRole(membership.role as TenantRole);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setTenantId(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, tenantSlug]);

  return { tenantId, role, loading, error };
};
