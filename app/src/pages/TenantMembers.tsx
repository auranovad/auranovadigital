import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantRole } from "@/hooks/useTenantRole";
import { useTenantSlug, getTenantPath } from "@/lib/tenant";
import { Link } from "react-router-dom";

type Member = {
  user_id: string;
  email: string | null;
  role: "admin" | "editor" | "viewer";
  created_at: string;
};

export default function TenantMembers() {
  const { tenantId, role } = useTenantRole();
  const slug = useTenantSlug();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Invitar por email
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const isAdmin = role === "admin";

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.rpc("member_list", { p_tenant: tenantId });
    if (error) {
      setErr(error.message);
    } else {
      setMembers((data as Member[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !tenantId) return;
    setErr(null);
    const { error } = await supabase.rpc("add_member_by_email", {
      p_tenant: tenantId,
      _email: inviteEmail.trim(),
      _role: inviteRole,
    });
    if (error) {
      setErr(error.message);
      return;
    }
    setInviteEmail("");
    setInviteRole("viewer");
    await load();
  };

  const onChangeRole = async (user_id: string, newRole: Member["role"]) => {
    if (!isAdmin || !tenantId) return;
    const { error } = await supabase
      .from("tenant_members")
      .update({ role: newRole })
      .eq("tenant_id", tenantId)
      .eq("user_id", user_id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  };

  const onRemove = async (user_id: string) => {
    if (!isAdmin || !tenantId) return;
    if (!confirm("¿Eliminar este miembro del tenant?")) return;
    const { error } = await supabase
      .from("tenant_members")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", user_id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Miembros</h1>
        <Link
          to={getTenantPath(slug, "/admin")}
          className="underline text-sm"
        >
          ← Volver al Admin
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {err && <p className="text-sm text-red-600 mb-2">{err}</p>}

      {isAdmin && (
        <form onSubmit={onInvite} className="border rounded-lg p-4 mb-6 grid gap-3">
          <h2 className="font-medium">Invitar por email</h2>
          <input
            className="border rounded px-3 py-2"
            placeholder="email@ejemplo.com"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Member["role"])}
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
          <button className="rounded bg-black text-white py-2">Invitar</button>
          <p className="text-xs text-gray-500">
            El usuario debe existir en Authentication → Users. Si no existe, créalo (o usa sign up).
          </p>
        </form>
      )}

      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Desde</th>
              {isAdmin && <th className="p-3">Acciones</th>}
            </tr>
          </thead>
        </table>
        {members.length === 0 ? (
          <div className="p-4 text-gray-500">No hay miembros todavía.</div>
        ) : (
          <ul>
            {members.map((m) => (
              <li key={m.user_id} className="p-3 border-t flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.email ?? m.user_id}</div>
                  <div className="text-xs text-gray-500">{m.user_id}</div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <select
                      className="border rounded px-2 py-1"
                      value={m.role}
                      onChange={(e) => onChangeRole(m.user_id, e.target.value as Member["role"])}
                    >
                      <option value="viewer">viewer</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span>{m.role}</span>
                  )}
                  {isAdmin && (
                    <button
                      className="text-red-600 underline"
                      onClick={() => onRemove(m.user_id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
