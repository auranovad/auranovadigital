import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: true,
    // Solo recoge tests de tu proyecto:
    include: ['src/test/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    // Y excluye *cualquier* "node_modules*" por si vuelve a aparecer
    exclude: [...configDefaults.exclude, 'node_modules*', '**/node_modules*/**'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] }
  }
})
