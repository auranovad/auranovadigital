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

  let payload: { tenant_id?: string; email?: string; role?: 'admin'|'editor'|'viewer' };
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { tenant_id, email, role } = payload ?? {};
  if (!tenant_id || !email || !role) {
    return json({ error: 'Missing payload: tenant_id, email, role' }, 400);
  }

  const baseRaw = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!baseRaw || !anon) {
    return json({ error: 'Missing Supabase env vars on Vercel' }, 500);
  }

  const fn = 'admin-invite-member';

  // Dos variantes de dominio:
  //  - Clásico: https://<ref>.supabase.co/functions/v1/<fn>
  //  - Nuevo:   https://<ref>.functions.supabase.co/<fn>
  const variantA = `${baseRaw}/functions/v1/${fn}`;
  const variantB = `${baseRaw.replace('.supabase.co', '.functions.supabase.co')}/${fn}`;

  const urls = [variantA, variantB];
  let lastText = '';
  let lastStatus = 500;

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anon,
          'Authorization': `Bearer ${anon}`,
        },
        body: JSON.stringify({ tenant_id, email, role }),
      });
      const text = await r.text();
      // Si no es 404, devolvemos tal cual lo que respondió Supabase.
      if (r.status !== 404) {
        return new Response(text, { status: r.status, headers: { 'content-type': 'application/json', ...corsHeaders } });
      }
      lastText = text;
      lastStatus = r.status;
    } catch (e: any) {
      lastText = e?.message ?? 'proxy_error';
      lastStatus = 500;
    }
  }

  return json({ error: 'not_found_after_variants', detail: lastText, tried: urls }, lastStatus);
}
