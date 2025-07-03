import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globals: true,
    isolate: false,
    fileParallelism: false,
    typecheck: {
      enabled: true,
      tsconfig: './test/tsconfig.json',
    },
    globalSetup: ['./test/config/globalSetup.ts'],
    setupFiles: ['./test/config/localSetup.ts'],
  },
  plugins: [tsconfigPaths()],
})
