import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globals: true,
    isolate: false,
    fileParallelism: false,
    globalSetup: ['./test/config/globalSetup.ts'],
  },
  plugins: [tsconfigPaths()],
})
