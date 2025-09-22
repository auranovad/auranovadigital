// Runtime Edge (no Node)
export const config = { runtime: 'edge' };

type TenantRole = 'admin' | 'editor' | 'viewer';

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

// Util: decodifica (sin verificar) un JWT para leer el "sub" (user id)
function decodeJwtSub(token: string): string | null {
  try {
    const [, payload] = token.split('.');
    const body = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return body?.sub ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST')  return json({ error: 'Method not allowed' }, 405);

  // --- ENV ---
  const BASE = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const SRV  = process.env.SUPABASE_SERVICE_ROLE || '';
  if (!BASE || !ANON || !SRV) return json({ error: 'Missing Supabase env vars' }, 500);

  // --- BODY ---
  let payload: { tenant_id?: string; email?: string; role?: TenantRole };
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const { tenant_id, email, role } = payload ?? {};
  if (!tenant_id || !email || !role) return json({ error: 'Missing payload: tenant_id, email, role' }, 400);

  // --- AUTH CALLER (JWT del usuario logueado en el navegador) ---
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json({ error: 'Missing Authorization Bearer <access_token>' }, 401);

  // (1) Verifica token contra /auth/v1/user (si no es válido -> 401)
  const userRes = await fetch(`${BASE}/auth/v1/user`, {
    headers: { 'apikey': ANON, 'Authorization': `Bearer ${token}` }
  });
  if (!userRes.ok) return json({ error: 'Invalid auth token' }, 401);
  const userJson = await userRes.json();
  const requesterId = userJson?.id || decodeJwtSub(token);
  if (!requesterId) return json({ error: 'Cannot resolve requester user id' }, 401);

  // (2) Comprueba que el requester sea ADMIN del tenant
  const memRes = await fetch(
    `${BASE}/rest/v1/tenant_members?tenant_id=eq.${tenant_id}&user_id=eq.${requesterId}&select=role`,
    {
      headers: {
        'apikey': SRV,
        'Authorization': `Bearer ${SRV}`,
        'Accept-Profile': 'public',
      },
    }
  );
  if (!memRes.ok) {
    const t = await memRes.text();
    return json({ error: 'membership_check_failed', detail: t }, 500);
  }
  const memArr = await memRes.json();
  const reqRole = (memArr?.[0]?.role as TenantRole) || null;
  if (reqRole !== 'admin') return json({ error: 'forbidden', detail: 'Only admin can invite' }, 403);

  // (3) Buscar usuario por email (Admin API)
  let userId: string | null = null;

  const findRes = await fetch(`${BASE}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { 'apikey': SRV, 'Authorization': `Bearer ${SRV}` },
  });
  if (findRes.ok) {
    const found = await findRes.json();
    if (Array.isArray(found) && found.length > 0) userId = found[0]?.id ?? null;
  }

  // (4) Si no existe -> invitar/crear
  if (!userId) {
    // Primero intentamos "invite" (envía email). Si ese endpoint no existe en tu GoTrue, caemos a "users".
    let created: any = null;

    const inviteRes = await fetch(`${BASE}/auth/v1/admin/invite`, {
      method: 'POST',
      headers: {
        'apikey': SRV,
        'Authorization': `Bearer ${SRV}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (inviteRes.ok) {
      created = await inviteRes.json();
    } else {
      // Fallback: crear el usuario (puede no enviar email)
      const createRes = await fetch(`${BASE}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': SRV,
          'Authorization': `Bearer ${SRV}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, email_confirm: false }),
      });
      if (!createRes.ok) {
        const t = await createRes.text();
        return json({ error: 'user_create_failed', detail: t }, 500);
      }
      created = await createRes.json();
    }

    userId = created?.id ?? null;
    if (!userId) return json({ error: 'no_user_id_from_admin_api' }, 500);
  }

  // (5) Upsert de la membresía (tenant_members)
  const upsertRes = await fetch(`${BASE}/rest/v1/tenant_members`, {
    method: 'POST',
    headers: {
      'apikey': SRV,
      'Authorization': `Bearer ${SRV}`,
      'content-type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify([{ tenant_id, user_id: userId, role }]),
  });

  if (!upsertRes.ok) {
    const t = await upsertRes.text();
    return json({ error: 'membership_upsert_failed', detail: t }, 500);
  }

  return json({ ok: true, invited: email, user_id: userId });
}
