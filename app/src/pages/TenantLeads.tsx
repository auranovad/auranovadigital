import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantRole, type TenantRole } from "@/hooks/useTenantRole";

type Lead = {
  id: string;
  tenant_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
};

export default function TenantLeads() {
  const { tenantId, role, loading } = useTenantRole();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function fetchLeads() {
    if (!tenantId) return;
    setError(null);
    console.log("[Leads] fetch for tenant", tenantId);
    const { data, error } = await supabase
      .from("leads")
      .select("id, tenant_id, name, email, phone, source, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Leads] fetch error:", error);
      setError(error.message);
      setLeads([]);
      return;
    }
    setLeads((data ?? []) as Lead[]);
  }

  useEffect(() => {
    if (tenantId) fetchLeads();
  }, [tenantId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      setError("No hay tenant asignado.");
      return;
    }
    if (!name.trim()) {
      setError("El nombre es requerido.");
      return;
    }

    setSaving(true);
    setError(null);
    console.log("[Leads] insert", { tenantId, name, email, phone });

    const { error } = await supabase.from("leads").insert({
      tenant_id: tenantId,
      name,
      email,
      phone,
      source: "manual",
      status: "new",
    } as never);

    setSaving(false);

    if (error) {
      console.error("[Leads] insert error:", error);
      setError(error.message);
      return;
    }

    // Exito: limpiar, cerrar formulario y recargar lista
    setName("");
    setEmail("");
    setPhone("");
    setShowForm(false);
    await fetchLeads();
  }

  const canEdit = (role === "admin" || role === "editor") as boolean;

  if (loading) {
    return <div style={{ padding: 16 }}>Cargando…</div>;
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <h2>Leads</h2>

      {/* Debug info pequeña (útil en dev) */}
      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        tenantId: <b>{tenantId ?? "(null)"}</b> &middot; role: <b>{role}</b>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>
      )}

      {canEdit && !showForm && (
        <button
          onClick={() => {
            setShowForm(true);
            setError(null);
          }}
          style={{ marginBottom: 12 }}
        >
          + Nuevo lead
        </button>
      )}

      {canEdit && showForm && (
        <form onSubmit={onSubmit} style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setName("");
                setEmail("");
                setPhone("");
                setError(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {leads.length === 0 ? (
        <p>No hay leads.</p>
      ) : (
        <ul style={{ paddingLeft: 16 }}>
          {leads.map((l) => (
            <li key={l.id} style={{ marginBottom: 8 }}>
              <b>{l.name}</b>{" "}
              <span style={{ color: "#666" }}>
                ({l.email ?? "sin email"} / {l.phone ?? "sin teléfono"})
              </span>
              <div style={{ fontSize: 12, color: "#888" }}>
                {l.source ?? "manual"} · {l.status ?? "new"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
