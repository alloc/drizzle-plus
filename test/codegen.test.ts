import fs from 'node:fs'
import { features } from '../src/codegen/manifest'
import { dialects } from '../src/codegen/registry'

describe('generated dialect modules', () => {
  test('emit every supported feature without unresolved placeholders', () => {
    for (const dialect of dialects) {
      for (const feature of features) {
        const path = `src/generated/${dialect}/${feature.name}.ts`
        if (feature.dialects.includes(dialect)) {
          expect(fs.existsSync(path)).toBe(true)
          expect(fs.readFileSync(path, 'utf8')).not.toContain('#dialect')
        } else {
          expect(fs.existsSync(path)).toBe(false)
        }
      }
    }
  })
})
