// src/pages/TenantMembers.tsx
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
const INVITE_FUNCTION = "admin-invite-member";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

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

  // Obtener mi email (para deshabilitarme cambios a mí mismo en la UI)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setMyEmail(data.user?.email ?? "");
      } catch {
        setMyEmail("");
      }
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

  useEffect(() => {
    if (tenantId) loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // Invitar miembro: (1) RPC si ya existe en Auth; (2) Edge Function si no existe
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return alert("Falta tenantId.");
    if (!isAdmin) return alert("Solo admin puede invitar.");
    if (!inviteEmail || !isValidEmail(inviteEmail)) return alert("Email inválido.");
    setWorking(true);

    try {
      // 1) intenta por RPC (requiere que el usuario exista en Authentication → Users)
      const rpc = await supabase.rpc("add_member_by_email", {
        p_tenant: tenantId,
        p_email: inviteEmail.trim(),
        p_role: inviteRole,
      });

      if (rpc.error) {
        // Si el backend nos indica que no existe el user, vamos por la función Edge
        if (rpc.error.message?.includes("user_not_found")) {
          const { error: fxErr } = await supabase.functions.invoke(INVITE_FUNCTION, {
            body: { tenant_id: tenantId, email: inviteEmail.trim(), role: inviteRole },
          });
          if (fxErr) throw fxErr;
          alert("Invitación enviada (se creó el usuario).");
        } else {
          throw rpc.error;
        }
      } else {
        alert("Miembro agregado/actualizado (usuario ya existía).");
      }

      setInviteEmail("");
      await loadMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("handleInvite error:", err);
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
        p_tenant: tenantId,
        p_user: userId,
        p_role: nextRole,
      });

      if (error) {
        console.error("set_member_role error", error);
        alert(error.message || "No se pudo cambiar el rol.");
      } else {
        await loadMembers();
      }
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete(userId: string) {
    if (!tenantId) return;
    if (!isAdmin) return alert("Solo admin puede eliminar.");
    if (!confirm("¿Eliminar este miembro?")) return;
    setWorking(true);

    try {
      const { error } = await supabase.rpc("remove_member", {
        p_tenant: tenantId,
        p_user: userId,
      });

      if (error) {
        console.error("remove_member error", error);
        alert(error.message || "No se pudo eliminar el miembro.");
      } else {
        await loadMembers();
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Miembros</h1>
        <Link to={`/t/${slug}/admin`} className="underline">
          ← Volver al Admin
        </Link>
      </div>

      {/* Formulario de invitación (solo admin) */}
      {isAdmin ? (
        <form onSubmit={handleInvite} className="border rounded-lg p-4 space-y-3 mb-6">
          <label className="block text-sm font-medium">Invitar por email</label>
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            disabled={!tenantId || working}
            required
          />

          <div className="flex items-center gap-2">
            <label className="text-sm">Rol:</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TenantRole)}
              className="border rounded px-3 py-2"
              disabled={!tenantId || working}
            >
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
            disabled={!tenantId || working}
          >
            {working ? "Enviando…" : "Invitar"}
          </button>

          <p className="text-xs text-gray-500">
            Si el email ya existe en Authentication → Users, se le asigna al tenant por RPC.
            Si no existe, la Edge Function <code>{INVITE_FUNCTION}</code> crea el usuario y envía la invitación.
          </p>
        </form>
      ) : (
        <div className="mb-6 rounded border p-4 bg-gray-50 text-sm">
          Solo los administradores pueden invitar miembros.
        </div>
      )}

      {/* Tabla de miembros */}
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
              <tr>
                <td className="px-4 py-3" colSpan={4}>Cargando…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>No hay miembros todavía.</td>
              </tr>
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
