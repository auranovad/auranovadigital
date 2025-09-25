// Ejecuta en Edge (sin @vercel/node)
export const config = { runtime: 'edge' };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const j = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...cors } });

function getProjectRef(base: string) {
  const m = base.match(/^https:\/\/([^.]+)\.supabase\.co/i);
  return m?.[1] ?? '';
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  // 0) Env vars
  const BASE = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE || '';
  if (!BASE || !ANON || !SERVICE) return j({ error: 'Missing Supabase envs' }, 500);

  // 1) Body
  let body: { tenant_id?: string; email?: string; role?: 'admin'|'editor'|'viewer' };
  try { body = await req.json(); } catch { return j({ error: 'Invalid JSON body' }, 400); }
  const { tenant_id, email, role } = body ?? {};
  if (!tenant_id || !email || !role) return j({ error: 'Missing payload: tenant_id, email, role' }, 400);

  // 2) Requiere token del usuario (del cliente Supabase)
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return j({ error: 'Missing Authorization Bearer <access_token>' }, 401);

  try {
    // 3) Resuelve el usuario del token
    const who = await fetch(`${BASE}/auth/v1/user`, {
      headers: { apikey: ANON, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return j({ error: 'Invalid or expired access_token' }, 401);
    const { id: user_id } = await who.json();

    // 4) Verifica que sea admin del tenant
    const rRole = await fetch(
      `${BASE}/rest/v1/tenant_members?tenant_id=eq.${encodeURIComponent(tenant_id)}&user_id=eq.${encodeURIComponent(user_id)}&select=role`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } } // service role salta RLS
    );
    if (!rRole.ok) return j({ error: 'role_lookup_failed' }, 500);
    const rows: Array<{ role: string }> = await rRole.json();
    const isAdmin = rows[0]?.role === 'admin';
    if (!isAdmin) return j({ error: 'forbidden: only tenant admin can invite' }, 403);

    // 5) Llama a la Edge Function (dos variantes por si acaso)
    const ref = getProjectRef(BASE);
    const variants = [
      `${BASE}/functions/v1/admin-invite-member`,
      ref ? `https://${ref}.functions.supabase.co/admin-invite-member` : null,
    ].filter(Boolean) as string[];

    let lastText = '';
    for (const url of variants) {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Usa service role aquí también (la función hará lo “admin”)
          apikey: SERVICE,
          Authorization: `Bearer ${SERVICE}`,
        },
        body: JSON.stringify({ tenant_id, email, role }),
      });
      lastText = await resp.text();
      if (resp.ok) {
        return new Response(lastText, { status: 200, headers: { 'content-type': 'application/json', ...cors } });
      }
      // si es 404, intenta la siguiente variante
      if (resp.status !== 404) {
        return new Response(lastText || '{"error":"invite_failed"}', { status: resp.status, headers: { 'content-type': 'application/json', ...cors } });
      }
    }
    return j({ error: 'not_found_after_variants', detail: lastText }, 404);
  } catch (e: any) {
    return j({ error: e?.message ?? 'proxy_error' }, 500);
  }
}
