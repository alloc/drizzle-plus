import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utils.ts',
    'src/types.ts',
    'src/pg/*.ts',
    'src/mysql/*.ts',
    'src/sqlite/*.ts',
  ],
  format: ['esm'],
  dts: true,
})
