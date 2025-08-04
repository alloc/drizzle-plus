import fs from 'node:fs'
import path from 'node:path'
import { dts } from 'rolldown-plugin-dts'
import { defineConfig } from 'rolldown/config'
import { globSync } from 'tinyglobby'

const generatedSourceRoot = 'src/generated'
const dialectEntries = ['pg', 'mysql', 'sqlite'].flatMap(dialect => {
  const dir = path.join(generatedSourceRoot, dialect)
  const modules = globSync(path.join(dir, '*.ts'))
  const moduleExtensions = modules.filter(modulePath =>
    fs.readFileSync(modulePath, 'utf-8').includes('declare module')
  )
  return [
    path.join(dir, 'index.ts'),
    path.join(dir, 'types.ts'),
    ...moduleExtensions,
  ]
})

export default defineConfig({
  input: mapToOutputFiles([
    'src/index.ts',
    'src/orThrow.ts',
    'src/utils.ts',
    'src/types.ts',
    'src/types/json.ts',
    ...dialectEntries,
  ]),
  output: [
    {
      dir: 'dist',
      format: 'es',
      // preserveModules: true,
      // preserveModulesRoot: 'src',
    },
  ],
  plugins: [
    dts({
      compilerOptions: {
        paths: {
          'drizzle-plus/*': ['./src/*', './src/generated/*'],
          'drizzle-plus': ['./src/index.ts'],
        },
      },
    }),
  ],
  external: ['drizzle-plus', 'drizzle-orm'],
})

function mapToOutputFiles(srcFiles: string[]) {
  return srcFiles.reduce(
    (out, file) => {
      const outFile = file.replace('src/', '').replace('.ts', '')
      out[outFile] = file
      return out
    },
    {} as Record<string, string>
  )
}
