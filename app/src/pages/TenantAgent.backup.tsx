import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantSlug } from "@/lib/tenant";

export default function TenantAgent() {
  const slug = useTenantSlug();
  const [log, setLog] = useState<string[]>([]);
  const [text, setText] = useState("");

  const append = (s:string)=>setLog(l=>[...l, s]);

  const run = async () => {
    append(`> ${text}`);
    const { data: t, error: terr } = await supabase.from("tenants").select("id").eq("slug", slug).single();
    if (terr || !t?.id) return append("No tenant");
    const tenantId = t.id as string;
    const lower = text.toLowerCase();

    try {
      if (lower.includes("cita") || lower.includes("agenda")) {
        const title = text;
        const start = new Date(Date.now() + 60*60*1000).toISOString(); // +1h
        const { error } = await supabase.rpc("create_appointment", {
          p_tenant: tenantId, p_lead: null, p_title: title, p_start: start, p_end: null
        });
        if (error) throw error;
        append("✅ Cita creada (inicio en +1h).");
      } else if (lower.includes("invitar") || lower.includes("invite")) {
        const match = text.match(/\b[\w.+-]+@[\w.-]+\.\w+\b/);
        if (!match) return append("No encontré email en el texto");
        const email = match[0];
        const { error } = await supabase.rpc("invite_member", {
          p_tenant: tenantId, p_email: email, p_role: "viewer"
        });
        if (error) throw error;
        append(`✅ Invitado: ${email}`);
      } else {
        append("No entendí. Prueba: 'agenda cita' o 'invitar correo@dominio.com'");
      }
    } catch (e:any) {
      append(`❌ ${e.message||String(e)}`);
    } finally { setText(""); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Brand Agent (MVP)</h1>
      <div className="flex gap-2 mb-3">
        <input className="border rounded px-3 py-2 flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="Ej: agenda cita mañana / invitar email@dominio.com" />
        <button onClick={run} className="border rounded px-3">Enviar</button>
      </div>
      <pre className="border rounded p-3 bg-gray-50 text-sm whitespace-pre-wrap">{log.join("\n")}</pre>
    </div>
  );
}
