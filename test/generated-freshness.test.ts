import fs from 'node:fs'
import path from 'node:path'
import { emitGeneratedFiles } from '../src/codegen/emit'

const generatedRoot = 'src/generated'

describe('generated files', () => {
  test('checked-in generated files match the generator output', () => {
    const before = readTree(generatedRoot)

    try {
      emitGeneratedFiles()
      expect(readTree(generatedRoot)).toEqual(before)
    } finally {
      restoreTree(generatedRoot, before)
    }
  })
})

function readTree(root: string): Record<string, string> {
  const files: Record<string, string> = {}
  for (const file of fs.readdirSync(root, { recursive: true })) {
    const filePath = path.join(root, file.toString())
    if (fs.statSync(filePath).isFile()) {
      files[filePath] = fs.readFileSync(filePath, 'utf-8')
    }
  }
  return files
}

function restoreTree(root: string, files: Record<string, string>) {
  fs.rmSync(root, { recursive: true, force: true })
  for (const [filePath, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
}
