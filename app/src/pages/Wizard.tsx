"use client";
import { useState } from "react";

const steps = ["Marca & Voz","Canales","Calendario","CRM","Políticas","Pruebas"];

export default function Wizard() {
  const [i, setI] = useState(0);
  const next = () => setI(v => Math.min(v + 1, steps.length - 1));
  const prev = () => setI(v => Math.max(v - 1, 0));

  return (
    <main className="container">
      <h2>Wizard — Configura tu Empresa</h2>
      <p>Paso {i + 1} / {steps.length}: <b>{steps[i]}</b></p>

      {i === 0 && (<section>
        <label>Marca: <input placeholder="VOMAY" /></label>
        <div style={{ marginTop: 8 }}>
          Tono: <select><option>Profesional</option><option>Cercano</option><option>Enérgico</option></select>
        </div>
      </section>)}

      {i === 1 && (<section>
        <p>Conecta tus canales</p>
        <button>WhatsApp</button> <button>IG/FB</button> <button>Telegram</button> <button>Email</button>
      </section>)}

      {i === 2 && (<section>
        <p>Calendario</p>
        <button>Google Calendar</button> <button>Microsoft 365</button>
      </section>)}

      {i === 3 && (<section>
        <p>CRM</p>
        <label><input type="radio" name="crm" defaultChecked /> No-CRM</label>{" "}
        <label><input type="radio" name="crm" /> HubSpot</label>{" "}
        <label><input type="radio" name="crm" /> Pipedrive</label>
      </section>)}

      {i === 4 && (<section>
        <p>Políticas de IA</p>
        <label><input type="checkbox" /> Requiere aprobación humana</label><br/>
        <label><input type="checkbox" /> Pausar si riesgo &gt; 70</label>
      </section>)}

      {i === 5 && (<section>
        <p>Pruebas guiadas</p>
        <button>Mensaje prueba</button> <button>Cita prueba</button> <button>Lead prueba</button>
      </section>)}

      <div style={{ marginTop: 16 }}>
        <button onClick={prev} disabled={i===0}>← Anterior</button>{" "}
        <button onClick={next} disabled={i===steps.length-1}>Siguiente →</button>
      </div>
    </main>
  );
}
