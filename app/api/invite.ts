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

  const { tenant_id, email, role } = (req.body ?? {}) as {
    tenant_id?: string;
    email?: string;
    role?: 'admin' | 'editor' | 'viewer';
  };

  if (!tenant_id || !email || !role) {
    return res.status(400).json({ error: 'Missing payload: tenant_id, email, role' });
  }

  const base = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!base || !anon) {
    return res.status(500).json({ error: 'Missing Supabase env vars on Vercel' });
  }

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
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'proxy_error' });
  }
}
