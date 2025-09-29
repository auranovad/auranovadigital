export const config = { runtime: "edge" };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

function j(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

const BASE =
  (globalThis as any).process?.env?.SUPABASE_URL ??
  (globalThis as any).SUPABASE_URL;
const SERVICE =
  (globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE ??
  (globalThis as any).SUPABASE_SERVICE_ROLE;
const ANON =
  (globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY ??
  (globalThis as any).process?.env?.SUPABASE_ANON_KEY ??
  (globalThis as any).NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (globalThis as any).VITE_SUPABASE_ANON_KEY ??
  (globalThis as any).SUPABASE_ANON_KEY;

function getProjectRef(base: string | undefined | null): string | null {
  try {
    if (!base) return null;
    const u = new URL(base);
    return u.hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return j({ error: "method_not_allowed" }, 405);
  }

  if (!BASE || !SERVICE) {
    return j({ error: "missing_env", need: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE"] }, 500);
  }

  const { email, tenant_id, role } = await req.json().catch(() => ({}));
  if (!email || !tenant_id || !role) {
    return j({ error: "bad_request", detail: "email, tenant_id y role son requeridos" }, 400);
  }

  // 1) Token del usuario actual
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return j({ error: "Missing Authorization Bearer <access_token>" }, 401);

  // 2) Resolver usuario del token
  {
    const who = await fetch(`${BASE}/auth/v1/user`, {
      headers: { apikey: ANON || SERVICE, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return j({ error: "Invalid or expired access_token" }, 401);
    const { id: user_id } = await who.json();

    // 3) Verificar que sea admin del tenant (saltando RLS con service role)
    const rRole = await fetch(
      `${BASE}/rest/v1/tenant_members?tenant_id=eq.${encodeURIComponent(
        tenant_id
      )}&user_id=eq.${encodeURIComponent(user_id)}&select=role`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }
    );
    if (!rRole.ok) return j({ error: "role_lookup_failed" }, 500);
    const rows: Array<{ role: string }> = await rRole.json();
    if (rows?.[0]?.role !== "admin") {
      return j({ error: "forbidden: only tenant admin can invite" }, 403);
    }
  }

  // 4) Intentar llamar a la Edge Function (probando ambos hosts y ambos nombres)
  const projectRef = getProjectRef(BASE);
  const names = ["admin-invite-member", "admin-invite-member-"];
  const hosts = [`${BASE}/functions/v1`, projectRef ? `https://${projectRef}.functions.supabase.co` : null].filter(Boolean) as string[];

  for (const h of hosts) {
    for (const n of names) {
      const url = `${h}/${n}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE,
          Authorization: `Bearer ${SERVICE}`,
        },
        body: JSON.stringify({ tenant_id, email, role }),
      });
      const txt = await resp.text();
      if (resp.ok) {
        return new Response(txt || '{"ok":true}', {
          status: 200,
          headers: { "content-type": "application/json", ...cors },
        });
      }
      // Si no es 404, devolver el error de la función
      if (resp.status !== 404) {
        return new Response(txt || '{"error":"invite_failed"}', {
          status: resp.status,
          headers: { "content-type": "application/json", ...cors },
        });
      }
    }
  }

  // 5) Fallback robusto: usar la Admin API sin Edge Function
  // 5.1) Buscar o crear (invite) al usuario en Auth
  let targetUserId: string | null = null;

  // Buscar por email
  const lookup = await fetch(
    `${BASE}/auth/v1/admin/users?email=eq.${encodeURIComponent(email)}`,
    { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }
  );
  if (lookup.ok) {
    const arr = await lookup.json();
    if (Array.isArray(arr) && arr[0]?.id) targetUserId = arr[0].id;
  }

  // Invitar (crea usuario y envía correo) si no existe
  if (!targetUserId) {
    const inv = await fetch(`${BASE}/auth/v1/admin/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
      },
      body: JSON.stringify({ email }),
    });
    if (!inv.ok) {
      const txt = await inv.text();
      return j({ error: "invite_admin_api_failed", detail: txt }, 500);
    }
    const u = await inv.json();
    targetUserId = u?.id ?? u?.user?.id ?? null;
  }

  if (!targetUserId) return j({ error: "no_user_id" }, 500);

  // 5.2) Upsert en tenant_members
  const up = await fetch(
    `${BASE}/rest/v1/tenant_members?on_conflict=tenant_id,user_id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify([{ tenant_id, user_id: targetUserId, role }]),
    }
  );

  if (!up.ok) {
    const txt = await up.text();
    return j({ error: "tenant_member_upsert_failed", detail: txt }, 500);
  }

  return j({ ok: true, via: "admin_api" }, 200);
}
