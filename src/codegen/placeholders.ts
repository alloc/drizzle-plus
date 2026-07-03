import type { DialectSpec } from './registry'

export function applyDialectPlaceholders(source: string, spec: DialectSpec) {
  let out = source

  out = rewritePlaceholderImports(out, spec)
  out = rewritePlaceholderModules(out, spec)
  out = rewritePlaceholderTypeParams(out, spec)
  out = removeDialectMarkerLines(out, spec)
  out = rewriteDialectModules(out, spec)
  out = rewriteDialectTypeNames(out, spec)
  out = rewriteDialectSessionTypes(out, spec)
  out = rewriteDialectTypeParameters(out, spec)
  out = rewriteDialectConstants(out, spec)
  out = rewriteAdapterImports(out, spec)

  assertNoUnresolvedPlaceholders(out)

  return out
}

const placeholderModules = {
  '#dialect/core': 'coreModule',
  '#dialect/db': 'dbModule',
  '#dialect/query': 'queryModule',
  'drizzle-plus/#dialect': 'functionsModule',
} as const

function rewritePlaceholderImports(source: string, spec: DialectSpec) {
  return source.replace(
    /import( type)? \{([\s\S]*?)\} from ['"](#dialect\/core|#dialect\/db|#dialect\/query|drizzle-plus\/#dialect)['"]/g,
    (
      match,
      typeKeyword: string | undefined,
      specifiers: string,
      module: string
    ) => {
      const map = placeholderMapForModule(spec, module)
      const rewritten = specifiers
        .split(',')
        .map(specifier => rewriteImportSpecifier(specifier, map))
        .join(',')
      return `import${typeKeyword ?? ''} {${rewritten}} from '${moduleSpecifierForPlaceholder(spec, module)}'`
    }
  )
}

function rewriteImportSpecifier(
  specifier: string,
  map: Record<string, string>
) {
  const trimmed = specifier.trim()
  if (!trimmed) {
    return specifier
  }

  const typePrefix = trimmed.startsWith('type ') ? 'type ' : ''
  const withoutType = typePrefix ? trimmed.slice(typePrefix.length) : trimmed
  const [imported, local] = withoutType.split(/\s+as\s+/)
  const actual = map[imported]
  if (!actual) {
    throw new Error(`Unknown dialect placeholder import: ${imported}`)
  }

  if (local || actual !== imported) {
    return specifier.replace(
      trimmed,
      `${typePrefix}${actual} as ${local ?? imported}`
    )
  }
  return specifier
}

function rewritePlaceholderModules(source: string, spec: DialectSpec) {
  return Object.keys(placeholderModules).reduce(
    (out, module) =>
      out.replaceAll(module, moduleSpecifierForPlaceholder(spec, module)),
    source
  )
}

function rewritePlaceholderTypeParams(source: string, spec: DialectSpec) {
  return source
    .replace(
      /\/\* #dialect\.databaseTypeParams \*\//g,
      spec.databaseTypeParams.join(',\n    ')
    )
    .replace(
      /\/\* #dialect\.relationalQueryBuilderTypeParams \*\//g,
      spec.relationalQueryBuilderTypeParams.join(',\n    ')
    )
    .replace(
      /\/\* #dialect\.relationalQueryTypeParams \*\//g,
      (spec.relationalQueryTypeParams ?? []).join(',\n    ')
    )
}

function placeholderMapForModule(spec: DialectSpec, module: string) {
  switch (module) {
    case '#dialect/core':
      return spec.placeholders.core
    case '#dialect/db':
      return spec.placeholders.db
    case '#dialect/query':
      return spec.placeholders.query
    case 'drizzle-plus/#dialect':
      return spec.placeholders.functions
    default:
      throw new Error(`Unknown dialect placeholder module: ${module}`)
  }
}

function moduleSpecifierForPlaceholder(spec: DialectSpec, module: string) {
  const field = placeholderModules[module as keyof typeof placeholderModules]
  if (!field) {
    throw new Error(`Unknown dialect placeholder module: ${module}`)
  }
  return spec[field]
}

function removeDialectMarkerLines(source: string, spec: DialectSpec) {
  return source
    .replace(/( *)\/\/ (\w+)-insert: (.*?)\n/g, (_, space, dialect, code) =>
      dialect === spec.name ? `${space}${code}\n` : ''
    )
    .replace(
      / *\/\/ (\w+)-remove-next-line\n([^\n]*\n)/g,
      (_, dialect, line) => (dialect === spec.name ? '' : line)
    )
}

function rewriteDialectModules(source: string, spec: DialectSpec) {
  return source
    .replaceAll('drizzle-orm/pg-core/query-builders/query', spec.queryModule)
    .replaceAll('drizzle-orm/pg-core/db', spec.dbModule)
    .replaceAll('drizzle-orm/pg-core', spec.coreModule)
    .replaceAll('drizzle-plus/pg', spec.functionsModule)
}

function rewriteDialectTypeNames(source: string, spec: DialectSpec) {
  if (spec.name === 'pg') {
    return source
  }

  return source
    .replace(/\bPgDatabase\b/g, spec.databaseType)
    .replace(/\bPg/g, spec.pgPrefix)
}

function rewriteDialectSessionTypes(source: string, spec: DialectSpec) {
  if (spec.name !== 'sqlite') {
    return source
  }

  return source.replace(
    /\b(session: |private session: |declare private session: )SQLiteSession\b/g,
    '$1SQLiteSession<any, any, any, any, any>'
  )
}

function rewriteDialectTypeParameters(source: string, spec: DialectSpec) {
  if (spec.name === 'pg') {
    return source
  }

  let out = source.replace(
    /\binterface RelationalQueryBuilder<([\s\S]*?)^\s*>/gm,
    () => `interface RelationalQueryBuilder<
    ${spec.relationalQueryBuilderTypeParams.join(',\n    ')},
  >`
  )

  out = out.replace(
    /\binterface \w+RelationalQuery<([\s\S]*?)^\s*>/gm,
    match => {
      if (!spec.relationalQueryTypeParams) {
        return match
      }
      const name = `${spec.pgPrefix}RelationalQuery`
      return `interface ${name}<
    ${spec.relationalQueryTypeParams.join(',\n    ')},
  >`
    }
  )

  return out
}

function rewriteDialectConstants(source: string, spec: DialectSpec) {
  return source
    .replace(/\bDIALECT\b/g, `'${spec.name}'`)
    .replace(/'\w+' (!==|===) '\w+'/g, expr => String(eval(expr)))
}

function rewriteAdapterImports(source: string, spec: DialectSpec) {
  return source.replace(
    /from ['"]\.\/adapters\/pg['"]/g,
    `from '../../internal/dialects/${spec.name}'`
  )
}

function assertNoUnresolvedPlaceholders(source: string) {
  const unresolved = [
    '/* #dialect.',
    '#dialect',
    'DIALECT',
    'mysql-insert:',
    'sqlite-insert:',
    'sqlite-remove-next-line',
  ].filter(token => source.includes(token))

  if (unresolved.length) {
    throw new Error(
      `Generated output still contains unresolved placeholders: ${unresolved.join(
        ', '
      )}`
    )
  }
}
