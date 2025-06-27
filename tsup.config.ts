import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utils.ts',
    'src/types.ts',
    'src/generated/pg/*.ts',
    'src/generated/mysql/*.ts',
    'src/generated/sqlite/*.ts',
  ],
  format: ['esm'],
  dts: {
    compilerOptions: {
      paths: {
        'drizzle-plus/*': ['./src/*'],
      },
    },
  },
  external: ['drizzle-plus'],
})
