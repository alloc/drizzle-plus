import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'tinyglobby'
import { defineConfig } from 'tsup'

const generatedSourceRoot = 'src/generated'
const moduleExtensions = globSync('*.ts', { cwd: generatedSourceRoot }).filter(
  name =>
    fs
      .readFileSync(path.join(generatedSourceRoot, name), 'utf-8')
      .includes('declare module')
)

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/orThrow.ts',
    'src/utils.ts',
    'src/types.ts',
    'src/types/json.ts',
    ...['pg', 'mysql', 'sqlite'].flatMap(dialect => {
      const dir = `${generatedSourceRoot}/${dialect}`
      return [
        `${dir}/index.ts`,
        `${dir}/types.ts`,
        // Module extensions
        ...moduleExtensions.map(name => `${dir}/${name}`),
      ]
    }),
  ],
  format: ['esm'],
  dts: {
    compilerOptions: {
      paths: {
        'drizzle-plus/*': ['./src/*'],
        'drizzle-plus': ['./src/index.ts'],
      },
    },
  },
  external: ['drizzle-plus'],
})
