import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";
import { useTenantRole } from "@/hooks/useTenantRole";

type Lead = {
  id?: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  created_at?: string;
};

export default function TenantLeads() {
  const slug = useTenantSlug();
  const { tenantId, role, loading } = useTenantRole();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Carga listado
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!tenantId) { setLeads([]); return; }
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, phone, source, status, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (!error) setLeads((data ?? []) as Lead[]);
    })();
    return () => { alive = false; };
  }, [tenantId]);

  async function saveLead() {
    if (!tenantId) return;
    const toInsert: Lead = {
      tenant_id: tenantId,
      name,
      email,
      phone,
      source: "web",
      status: "new",
    };
    const { error } = await supabase.from("leads").insert(toInsert); // insert acepta objeto; evitamos 'any' en el resto
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    setCreating(false);
    setName(""); setEmail(""); setPhone("");

    // refrescar
    const { data } = await supabase
      .from("leads")
      .select("id, name, email, phone, source, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    setLeads((data ?? []) as Lead[]);
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Leads</h2>

      {!loading && tenantId && (role === "admin" || role === "editor") && (
        <div style={{ marginBottom: 16 }}>
          {!creating ? (
            <button onClick={() => setCreating(true)}>+ Nuevo lead</button>
          ) : (
            <div style={{ maxWidth: 520, border: "1px solid #ddd", padding: 12 }}>
              <input
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: 8 }}
              />
              <div>
                <button onClick={saveLead}>Guardar</button>
                <button
                  onClick={() => { setCreating(false); setName(""); setEmail(""); setPhone(""); }}
                  style={{ marginLeft: 8 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!tenantId && (
        <p style={{ color: "crimson" }}>
          Tenant no encontrado para este slug. ¿Creaste el tenant y tu membership en Supabase?
        </p>
      )}

      {leads.length === 0 ? (
        <p>No hay leads.</p>
      ) : (
        <ul style={{ lineHeight: 1.7 }}>
          {leads.map((l) => (
            <li key={l.id}>
              <strong>{l.name}</strong> ({l.email} / {l.phone})
              <div style={{ fontSize: 12, color: "#666" }}>{l.source} · {l.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
