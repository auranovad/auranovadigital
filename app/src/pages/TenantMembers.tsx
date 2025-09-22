import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import useTenantRole from "@/hooks/useTenantRole";

type TenantRole = "admin" | "editor" | "viewer" | "none";

type MemberRow = {
  user_id: string;
  email: string;
  role: TenantRole | null;
  joined_at: string | null;
};

const ROLES: TenantRole[] = ["admin", "editor", "viewer", "none"];

export default function TenantMembers() {
  const { slug } = useParams();
  const { tenantId, role: myRole, loading: roleLoading } = useTenantRole(slug);

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TenantRole>("viewer");
  const [myEmail, setMyEmail] = useState<string>("");

  const isAdmin = useMemo(() => myRole === "admin", [myRole]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyEmail(user?.email ?? "");
    })();
  }, []);

  async function loadMembers() {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("member_list", { p_tenant: tenantId });
    if (error) {
      console.error("member_list error", error);
      alert(error.message || "Error listando miembros");
    } else {
      const mapped = (data as MemberRow[]).map((r) => ({
        ...r,
        role: (r.role as TenantRole) ?? "viewer",
      }));
      setRows(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (tenantId) loadMembers(); }, [tenantId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !inviteEmail) return;
    setWorking(true);
    try {
      // 1) RPC si el usuario ya existe
      const rpc = await supabase.rpc("add_member_by_email", {
        p_tenant: tenantId,
        p_email: inviteEmail.trim(),
        p_role: inviteRole,
      });

      if (rpc.error && rpc.error.message?.includes("user_not_found")) {
        // 2) Fallback: proxy Vercel protegido (requiere token)
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        alert("Invitación enviada.");
      } else if (rpc.error) {
        throw rpc.error;
      } else {
        alert("Miembro agregado/actualizado.");
      }

      setInviteEmail("");
      await loadMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg || "Error al invitar");
    } finally {
      setWorking(false);
    }
  }

  async function handleChangeRole(userId: string, nextRole: TenantRole) {
    if (!tenantId) return;
    if (!isAdmin) return alert("Solo admin puede cambiar roles.");
    if (nextRole === "none") return alert("Rol inválido.");
    setWorking(true);
    try {
      const { error } = await supabase.rpc("set_member_role", {
        p_tenant: tenantId, p_user: userId, p_role: nextRole,
      });
      if (error) {
        console.error("set_member_role error", error);
        alert(error.message || "No se pudo cambiar el rol.");
      } else {
        await loadMembers();
      }
    } finally { setWorking(false); }
  }

  async function handleDelete(userId: string) {
    if (!tenantId) return;
    if (!isAdmin) return alert("Solo admin puede eliminar.");
    if (!confirm("¿Eliminar este miembro?")) return;
    setWorking(true);
    try {
      const { error } = await supabase.rpc("remove_member", { p_tenant: tenantId, p_user: userId });
      if (error) {
        console.error("remove_member error", error);
        alert(error.message || "No se pudo eliminar el miembro.");
      } else {
        await loadMembers();
      }
    } finally { setWorking(false); }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Miembros</h1>
        <Link to={`/t/${slug}/admin`} className="underline">← Volver al Admin</Link>
      </div>

      <form onSubmit={handleInvite} className="border rounded-lg p-4 space-y-3 mb-6">
        <label className="block text-sm font-medium">Invitar por email</label>
        <input
          type="email"
          placeholder="email@ejemplo.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={!isAdmin || working}
        />

        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as TenantRole)}
          className="border rounded px-3 py-2"
          disabled={!isAdmin || working}
        >
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
          disabled={!isAdmin || working}
        >
          Invitar
        </button>

        <p className="text-xs text-gray-500">
          Si el email ya existe en Authentication → Users, se le asigna por RPC. Si no existe, la Function de Vercel crea el usuario y envía la invitación.
        </p>
      </form>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Rol</th>
              <th className="text-left px-4 py-2">Desde</th>
              <th className="text-left px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading || roleLoading ? (
              <tr><td className="px-4 py-3" colSpan={4}>Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-3" colSpan={4}>No hay miembros todavía.</td></tr>
            ) : (
              rows.map((m) => {
                const isSelf = m.email === myEmail;
                return (
                  <tr key={m.user_id} className="border-t">
                    <td className="px-4 py-2">{m.email}</td>
                    <td className="px-4 py-2">
                      <select
                        value={m.role ?? "viewer"}
                        onChange={(e) => handleChangeRole(m.user_id, e.target.value as TenantRole)}
                        disabled={!isAdmin || working || isSelf}
                        className="border rounded px-2 py-1"
                      >
                        {ROLES.filter((r) => r !== "none").map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {m.joined_at ? new Date(m.joined_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDelete(m.user_id)}
                        className="text-red-600 underline disabled:opacity-60"
                        disabled={!isAdmin || working || isSelf}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
