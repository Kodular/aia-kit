import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#/': './src/',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
})
