import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DEFAULT_TENANT } from "@/lib/tenant";

export default function Wizard() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Inicializando…");

  useEffect(() => {
    (async () => {
      try {
        const { data: me } = await supabase.auth.getUser();
        if (!me?.user?.id) return nav("/login", { replace: true });

        const { error } = await supabase.rpc("bootstrap_tenant", {
          p_slug: DEFAULT_TENANT, p_name: "AURANOVA"
        });
        if (error) throw error;

        setMsg("Listo. Redirigiendo…");
        nav(`/t/${DEFAULT_TENANT}/admin`, { replace: true });
      } catch (e:any) {
        setMsg(`Error: ${e.message||String(e)}`);
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="max-w-md w-full border rounded p-6">
        <h1 className="text-xl font-semibold mb-2">Wizard</h1>
        <p className="text-sm text-gray-600">{msg}</p>
      </div>
    </div>
  );
}
