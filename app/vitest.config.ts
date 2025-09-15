import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      '.vercel/**',
      'coverage/**',
    ],
    environment: 'jsdom',
    // Si no usas setup, quita la línea de abajo o crea tests/setup.ts (paso 3)
    setupFiles: ['tests/setup.ts'],
    css: false,
  },
})
