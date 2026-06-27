import fs from 'node:fs'
import path from 'node:path'

export function validateGeneratedExports() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8')) as {
    exports?: Record<string, unknown>
  }

  for (const [specifier, value] of Object.entries(packageJson.exports ?? {})) {
    if (!specifier.startsWith('./pg') &&
        !specifier.startsWith('./mysql') &&
        !specifier.startsWith('./sqlite')) {
      continue
    }

    if (specifier.endsWith('/*')) {
      continue
    }

    const paths = exportPaths(value)
    for (const exportPath of paths) {
      if (!exportPath.includes('*') && !fs.existsSync(exportPath.replace(/^\.\//, ''))) {
        throw new Error(`Package export ${specifier} points at missing file ${exportPath}`)
      }
    }
  }
}

function exportPaths(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (!value || typeof value !== 'object') {
    return []
  }
  return Object.values(value as Record<string, unknown>).flatMap(exportPaths)
}
