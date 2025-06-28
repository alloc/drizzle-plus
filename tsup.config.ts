import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utils.ts',
    'src/types.ts',
    ...['pg', 'mysql', 'sqlite'].flatMap(dialect => {
      const dir = `src/generated/${dialect}`
      return [
        `${dir}/index.ts`,
        `${dir}/types.ts`,
        // Prototype extensions
        `${dir}/count.ts`,
        `${dir}/cursor.ts`,
        `${dir}/findManyAndCount.ts`,
        `${dir}/upsert.ts`,
      ]
    }),
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
