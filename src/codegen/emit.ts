import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'tinyglobby'
import { features } from './manifest'
import { applyDialectPlaceholders } from './placeholders'
import { dialects, registry } from './registry'
import { validateGeneratedExports } from './validate'

const generatedRoot = 'src/generated'

export function emitGeneratedFiles(options: { noRemove?: boolean } = {}) {
  for (const dialect of dialects) {
    const root = path.join(generatedRoot, dialect)
    if (!options.noRemove) {
      fs.rmSync(root, {
        recursive: true,
        force: true,
      })
    }

    fs.mkdirSync(root, { recursive: true })
    fs.writeFileSync(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({
        extends: '../../../tsconfig.json',
        include: ['./'],
        exclude: [],
      })
    )
    fs.writeFileSync(path.join(root, 'index.ts'), '')
  }

  for (const feature of features) {
    const source = fs.readFileSync(feature.source, 'utf-8')
    for (const dialect of feature.dialects) {
      const spec = registry[dialect]
      const content =
        '// @ts-nocheck\n' + applyDialectPlaceholders(source, spec)
      fs.writeFileSync(
        path.join(generatedRoot, dialect, feature.name + '.ts'),
        content
      )
    }
  }

  for (const dialect of dialects) {
    const indexPath = path.join(generatedRoot, dialect, 'index.ts')
    for (const file of globSync(`src/functions/${dialect}/*.ts`)) {
      const name = path.basename(file, '.ts')
      fs.appendFileSync(indexPath, `export * from '../../functions/${dialect}/${name}'\n`)
    }
  }

  validateGeneratedExports()
}
