import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // acepta variables VITE_ y NEXT_PUBLIC_ en Vite
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
