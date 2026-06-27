import fs from 'node:fs'

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

    for (const exportPath of exportPaths(value)) {
      if (exportPath.includes('*')) {
        continue
      }

      const sourcePath = sourcePathForExport(exportPath)
      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          `Package export ${specifier} points at missing source ${sourcePath}`
        )
      }
    }
  }
}

function sourcePathForExport(exportPath: string) {
  return exportPath
    .replace(/^\.\//, '')
    .replace(/^dist\//, 'src/')
    .replace(/\.(?:d\.ts|js)$/, '.ts')
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
