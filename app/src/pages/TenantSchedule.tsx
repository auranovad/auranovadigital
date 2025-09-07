import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";

type Appt = { id: string; title: string|null; start_at: string; end_at: string|null; lead_id: string|null };

export default function TenantSchedule() {
  const slug = useTenantSlug();
  const [tenantId, setTenantId] = useState<string>("");
  const [items, setItems] = useState<Appt[]>([]);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");

  const refresh = async (tid: string) => {
    const { data, error } = await supabase.rpc("list_appointments", { p_tenant: tid });
    if (!error) setItems((data as Appt[]) ?? []);
    else alert(error.message);
  };

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("tenants").select("id").eq("slug", slug).single();
      if (t?.id) { setTenantId(t.id); await refresh(t.id); }
    })();
  }, [slug]);

  const create = async () => {
    if (!tenantId || !title || !start) return;
    const { error } = await supabase.rpc("create_appointment", {
      p_tenant: tenantId, p_lead: null, p_title: title, p_start: start, p_end: null
    });
    if (!error) { setTitle(""); setStart(""); await refresh(tenantId); }
    else alert(error.message);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Agenda</h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input className="border rounded px-2 py-1 flex-1" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="border rounded px-2 py-1 flex-1" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
        <button className="border rounded px-3 py-1" onClick={create}>Crear</button>
      </div>
      <ul className="space-y-2">
        {items.map(a=>(
          <li key={a.id} className="border rounded p-2">
            <div className="font-medium">{a.title || "(sin título)"}</div>
            <div className="text-sm text-gray-500">{new Date(a.start_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
