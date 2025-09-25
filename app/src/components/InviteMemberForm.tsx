import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { tenantId: string };

export default function InviteMemberForm({ tenantId }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor" | "admin">("viewer");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (!tenantId) throw new Error("Falta tenantId");
      if (!email) throw new Error("Email requerido");

      // IMPORTANTE: tu función en Supabase se llama con guion al final
      const { data, error } = await supabase.functions.invoke("admin-invite-member-", {
        body: { tenant_id: tenantId, email, role },
      });
      if (error) throw error;
      setMsg("Invitación enviada ✅");
      setEmail("");
      setRole("viewer");
    } catch (err: any) {
      setMsg(err?.message ?? "Error invitando al usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          placeholder="persona@correo.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Invitar"}
      </button>

      {msg && <p className="text-sm">{msg}</p>}
      {!tenantId && (
        <p className="text-xs text-red-600">
          Falta tenantId. Asegúrate de pasar el tenantId del contexto o de la página.
        </p>
      )}
    </form>
  );
}
