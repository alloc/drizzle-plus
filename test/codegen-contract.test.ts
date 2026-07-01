import fs from 'node:fs'
import path from 'node:path'
import { features } from '../src/codegen/manifest'
import { dialects } from '../src/codegen/registry'
import { validateGeneratedExports } from '../src/codegen/validate'

describe('codegen contract', () => {
  test('declared features have source and generated files', () => {
    for (const feature of features) {
      expect(fs.existsSync(feature.source), feature.source).toBe(true)

      for (const dialect of dialects) {
        const generatedPath = path.join(
          'src/generated',
          dialect,
          `${feature.name}.ts`
        )

        expect(fs.existsSync(generatedPath), generatedPath).toBe(
          feature.dialects.includes(dialect)
        )
      }
    }
  })

  test('package dialect exports resolve before dist exists', () => {
    expect(() => validateGeneratedExports()).not.toThrow()
  })
})
