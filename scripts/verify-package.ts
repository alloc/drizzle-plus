import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { features } from '../src/codegen/manifest'
import { dialects } from '../src/codegen/registry'

const requiredFiles = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/orThrow.js',
  'dist/orThrow.d.ts',
  'dist/utils.js',
  'dist/utils.d.ts',
  'dist/types.js',
  'dist/types.d.ts',
]

for (const file of requiredFiles) {
  assertFile(file)
}

for (const dialect of dialects) {
  assertFile(`dist/generated/${dialect}/index.js`)
  assertFile(`dist/generated/${dialect}/index.d.ts`)

  for (const feature of features) {
    if (feature.name === 'internal' || !feature.dialects.includes(dialect)) {
      continue
    }

    const modulePath = `dist/generated/${dialect}/${feature.name}.js`
    assertFile(modulePath)
    assertFile(modulePath.replace(/\.js$/, '.d.ts'))
    await import(pathToFileURL(path.resolve(modulePath)).href)
  }
}

function assertFile(file: string) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing built package file: ${file}`)
  }
}
