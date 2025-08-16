// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">AuraNovaDigital</h1>
        <p className="text-xl text-muted-foreground">
          Plataforma empresarial moderna para gestión digital
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a 
            href="/admin" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Panel de Administración
          </a>
          <a 
            href="/admin/wizard" 
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Configuración Inicial
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
