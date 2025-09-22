// Edge runtime (sin @vercel/node)
export const config = { runtime: 'edge' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const base = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE;

  if (!base || !anon || !service) {
    return json({ error: 'Missing Supabase env vars on Vercel' }, 500);
  }

  // 1) Token del usuario que invita (JWT del front)
  const authHdr = req.headers.get('authorization') || req.headers.get('Authorization');
  const bearer = authHdr?.startsWith('Bearer ') ? authHdr.slice(7) : null;
  if (!bearer) return json({ error: 'Unauthorized' }, 401);

  // 2) Validar sesión y obtener user.id
  const uRes = await fetch(`${base}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${bearer}`, 'apikey': anon },
  });
  if (!uRes.ok) {
    return json({ error: 'Invalid session' }, 401);
  }
  const me = await uRes.json();
  const callerId = me?.id as string | undefined;
  if (!callerId) return json({ error: 'Invalid user' }, 401);

  // 3) Leer payload
  let payload: { tenant_id?: string; email?: string; role?: 'admin'|'editor'|'viewer' };
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { tenant_id, email, role } = payload ?? {};
  if (!tenant_id || !email || !role) {
    return json({ error: 'Missing payload: tenant_id, email, role' }, 400);
  }

  // 4) Verificar que el llamante es ADMIN del tenant
  const check = await fetch(
    `${base}/rest/v1/tenant_members?tenant_id=eq.${tenant_id}&user_id=eq.${callerId}&role=in.(admin)&select=user_id&limit=1`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  );
  if (!check.ok) return json({ error: 'membership_check_failed' }, 500);
  const arr = await check.json() as unknown[];
  if (!Array.isArray(arr) || arr.length === 0) {
    return json({ error: 'forbidden_not_admin' }, 403);
  }

  // 5) Llamar a la Edge Function de Supabase (crea user si no existe + envía email)
  try {
    const r = await fetch(`${base}/functions/v1/admin-invite-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
      },
      body: JSON.stringify({ tenant_id, email, role }),
    });
    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    return json({ error: e?.message ?? 'proxy_error' }, 500);
  }
}
