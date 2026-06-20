import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./src/test-utils/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks', // evita conflictos de módulos nativos (argon2)
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
