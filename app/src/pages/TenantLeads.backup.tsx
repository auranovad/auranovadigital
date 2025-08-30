import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantRole } from "@/hooks/useTenantRole";
import { useTenantSlug } from "@/lib/tenant";

type Lead = {
  id: string;
  tenant_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
};

export default function TenantLeads() {
  const { tenantId, role, loading } = useTenantRole();
  const slug = useTenantSlug();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      if (!tenantId) { setLeads([]); return; }
      const { data, error } = await supabase
        .from("leads" as any)
        .select("id, tenant_id, name, email, phone, source, status")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });

      if (error) setError(error.message);
      setLeads((data ?? []) as Lead[]);
    }
    if (!loading) fetchLeads();
  }, [tenantId, loading]);

  async function createLead() {
    setError(null);
    if (!tenantId) return;
    const payload = {
      tenant_id: tenantId,
      name: form.name || null,
      email: form.email || null,
      phone: form.phone || null,
      source: "manual",
      status: "new",
    };
    const { error } = await supabase.from("leads" as any).insert(payload);
    if (error) { setError(error.message); return; }
    setCreating(false);
    setForm({ name: "", email: "", phone: "" });
    // refresca lista
    const { data } = await supabase
      .from("leads" as any)
      .select("id, tenant_id, name, email, phone, source, status")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    setLeads((data ?? []) as Lead[]);
  }

  if (loading) return <div>Cargando...</div>;
  if (!tenantId) {
    return (
      <div style={{ color: "crimson" }}>
        Tenant no encontrado para este slug. ¿Creaste el tenant y tu membership en Supabase?
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h2>Leads</h2>
      <div style={{ margin: "8px 0 16px", fontSize: 12, color: "#666" }}>
        slug: <b>{slug}</b> · tenantId: <b>{tenantId}</b> · role: <b>{role}</b>
      </div>

      {(role === "editor" || role === "admin") && (
        <div style={{ marginBottom: 16 }}>
          {!creating ? (
            <button onClick={() => setCreating(true)}>Nuevo lead</button>
          ) : (
            <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <input
                  placeholder="Nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  placeholder="Teléfono"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button onClick={createLead}>Guardar</button>
                <button onClick={() => setCreating(false)}>Cancelar</button>
              </div>
              {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}
            </div>
          )}
        </div>
      )}

      {leads.length === 0 ? (
        <div>No hay leads.</div>
      ) : (
        <ul style={{ paddingLeft: 16 }}>
          {leads.map((l) => (
            <li key={l.id}>
              <b>{l.name || "(sin nombre)"}</b> — {l.email || "—"} — {l.phone || "—"} ·{" "}
              <i>{l.status}</i>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
