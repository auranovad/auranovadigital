import { Toaster as Sonner } from "sonner";
export { toast } from "sonner";

export function Toaster() {
  // Tema por defecto: respeta prefers-color-scheme;
  // si luego añades ThemeProvider, aquí lo sincronizas.
  return <Sonner richColors position="top-center" />;
}
