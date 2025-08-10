export default function Admin() {
  return (
    <main className="container">
      <h2>Estado del Tenant</h2>
      <div className="grid">
        <div>Conexiones: WA ○ IG/FB ○ TG ○ Email ○ GCal ○</div>
        <div>CRM: No-CRM (activo)</div>
        <div>Próximos: 0 citas | Publicaciones: 0</div>
        <div>Seguridad: 0 incidentes | Auditoría: 0</div>
      </div>
      <p style={{ marginTop: 16 }}>
        <a href="/admin/wizard">Ir al Wizard →</a>
      </p>
    </main>
  );
}
