import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
    // Previene "process is not defined" si alguna lib lo toca en el bundle
    'process.env': {},
  },
})
