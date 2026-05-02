import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#/': './src/',
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
})