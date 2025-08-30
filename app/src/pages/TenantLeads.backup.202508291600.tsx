import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantRole } from "@/hooks/useTenantRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function TenantLeads() {
  const { tenantId, role } = useTenantRole();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = role === "editor" || role === "admin";

  const fetchLeads = useCallback(async () => {
    if (!tenantId) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Quitar genéricos: .from("leads") y castear
    const { data, error } = await supabase
      .from("leads")
      .select("id, tenant_id, name, email, phone, source, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Leads] fetch error", error);
      setLeads([]);
    } else {
      setLeads((data ?? []) as Lead[]);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async () => {
    if (!tenantId) return;
    // Quitar genéricos en insert también
    const { error } = await supabase.from("leads").insert({
      tenant_id: tenantId,
      name: "Nuevo Lead",
      email: "lead@example.com",
      phone: "000-000",
      source: "manual",
      status: "new",
    } as Lead);
    if (error) {
      console.error("[Leads] insert error", error);
      return;
    }
    fetchLeads();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Leads</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">role: {role}</Badge>
          {canCreate && <Button onClick={addLead}>Añadir lead</Button>}
        </div>
      </div>

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <div className="grid gap-3">
          {leads.map((l) => (
            <Card key={l.id}>
              <CardHeader>
                <CardTitle className="text-sm">{l.name || "Sin nombre"}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>Email: {l.email || "—"}</div>
                <div>Tel: {l.phone || "—"}</div>
                <div>Source: {l.source}</div>
                <div>Status: {l.status}</div>
              </CardContent>
            </Card>
          ))}
          {!leads.length && (
            <div className="text-sm text-muted-foreground">No hay leads.</div>
          )}
        </div>
      )}
    </div>
  );
}
