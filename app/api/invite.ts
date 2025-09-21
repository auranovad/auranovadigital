import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight (por si algún día llamas desde otro origen)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Acepta JSON en string o ya parseado
  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body ?? {});
  const { tenant_id, email, role } = (body ?? {}) as {
    tenant_id?: string;
    email?: string;
    role?: 'admin' | 'editor' | 'viewer';
  };

  if (!tenant_id || !email || !role) {
    return res.status(400).json({ error: 'Missing payload: tenant_id, email, role' });
  }

  const baseRaw = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const base = baseRaw.replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!base || !anon) {
    return res.status(500).json({ error: 'Missing Supabase env vars on Vercel' });
  }

  const slugs = ['admin-invite-member', 'admin-invite-member-'];

  try {
    let lastStatus = 500;
    let lastText = '';

    for (const slug of slugs) {
      const url = `${base}/functions/v1/${slug}`;
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
      // Si NO es 404 "Requested function was not found", devolvemos tal cual
      const isNotFound = r.status === 404 && /Requested function was not found/i.test(text);
      if (!isNotFound) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(r.status).send(text);
      }

      lastStatus = r.status;
      lastText = text;
    }

    // Si probamos ambos y ambos dieron NOT_FOUND
    return res.status(lastStatus).send(lastText || JSON.stringify({ error: 'not_found' }));
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'proxy_error' });
  }
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
