// app/src/pages/TenantLeads.tsx
import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";
import { useTenantRole } from "@/hooks/useTenantRole";

type Lead = {
  id: string;
  tenant_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  created_at?: string;
};

const EMPTY: Omit<Lead, "id" | "tenant_id"> = {
  name: "",
  email: "",
  phone: "",
  source: "manual",
  status: "new",
};

export default function TenantLeads() {
  const slug = useTenantSlug();
  const { tenantId, role, loading: roleLoading } = useTenantRole();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const canCreate = role === "editor" || role === "admin";

  async function fetchLeads() {
    if (!tenantId) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("leads")
      .select("id, tenant_id, name, email, phone, source, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;

    const payload = {
      tenant_id: tenantId,
      name: form.name?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      source: form.source || "manual",
      status: form.status || "new",
    };

    const { error } = await supabase.from("leads").insert(payload);
    if (error) {
      alert(error.message);
      return;
    }

    setShowForm(false);
    setForm(EMPTY);
    fetchLeads();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Leads</h1>

        {tenantId && canCreate && (
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? "Cancelar" : "Nuevo lead"}
          </button>
        )}
      </div>

      {showForm && tenantId && canCreate && (
        <form
          onSubmit={handleCreate}
          className="grid gap-3 border rounded-lg p-4 mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border rounded p-2"
              placeholder="Nombre"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Teléfono"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Fuente"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
            <select
              className="border rounded p-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="qualified">qualified</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-2 bg-black text-white rounded-md text-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              className="px-3 py-2 border rounded-md text-sm"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {roleLoading || loading ? (
        <p>Cargando...</p>
      ) : leads.length === 0 ? (
        <p>No hay leads.</p>
      ) : (
        <ul className="divide-y">
          {leads.map((l) => (
            <li key={l.id} className="py-3">
              <div className="font-medium">
                {l.name || "(sin nombre)"}{" "}
                <span className="text-xs px-2 py-0.5 ml-2 rounded border">
                  {l.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {l.email || "—"} · {l.phone || "—"} · {l.source}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
