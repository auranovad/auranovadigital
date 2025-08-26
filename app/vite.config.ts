import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Aceptamos VITE_* o NEXT_PUBLIC_* (por si sólo configuraste una de las dos)
const url  = process.env.VITE_SUPABASE_URL       ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url)  throw new Error('Missing VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL at build time')
if (!anon) throw new Error('Missing VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY at build time')

export default defineConfig({
  base: '/', // sirve /assets correctamente en prod
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  define: {
    // Evita "process is not defined" si alguna lib lo usa en el bundle
    'process.env': {},
    // Incrustamos explícitamente los valores elegidos (url/anon) en el bundle
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anon),
  },
})
