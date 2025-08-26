import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// --- Guard: si faltan las env en build, fallamos aquí mismo ---
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const
for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`Missing ${k} at build time`)
  }
}
// ---------------------------------------------------------------

export default defineConfig({
  base: '/', // importante para servir /assets en producción
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  define: {
    // evita "process is not defined" si alguna lib lo usa en el bundle
    'process.env': {},

    // Incrustamos explícitamente las VITE_* en el bundle
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
})
