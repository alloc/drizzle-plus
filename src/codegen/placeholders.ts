import type { DialectSpec } from './registry'

export function applyDialectPlaceholders(source: string, spec: DialectSpec) {
  let out = source

  out = rewritePlaceholderImports(out, spec)
  out = rewritePlaceholderModules(out, spec)
  out = rewritePlaceholderDeclarations(out, spec)
  out = rewritePlaceholderTypeParams(out, spec)
  out = removeDialectMarkerLines(out, spec)
  out = rewriteDialectModules(out, spec)
  out = rewriteDialectPublicTypeNames(out, spec)
  out = rewriteDialectTypeNames(out, spec)
  out = rewriteDialectSessionTypes(out, spec)
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
    /import( type)? \{([^}]*)\} from ['"](#dialect\/core|#dialect\/db|#dialect\/query|drizzle-plus\/#dialect)['"]/g,
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

function rewritePlaceholderDeclarations(source: string, spec: DialectSpec) {
  return source
    .replace(/\binterface Database</g, `interface ${spec.databaseType}<`)
    .replace(
      /\binterface SelectBuilder</g,
      `interface ${spec.placeholders.core.SelectBuilder}<`
    )
    .replace(
      /\binterface Table</g,
      `interface ${spec.placeholders.core.Table}<`
    )
    .replace(
      /\binterface RelationalQueryBuilder</g,
      `interface ${spec.placeholders.query.RelationalQueryBuilder}<`
    )
    .replace(
      /\binterface RelationalQuery</g,
      `interface ${spec.placeholders.query.RelationalQuery}<`
    )
}

function rewritePlaceholderTypeParams(source: string, spec: DialectSpec) {
  let out = rewriteInterfaceTypeParams(
    source,
    spec.databaseType,
    spec.databaseTypeParams
  )

  out = rewriteInterfaceTypeParams(
    out,
    spec.placeholders.query.RelationalQueryBuilder,
    spec.relationalQueryBuilderTypeParams
  )

  if (spec.relationalQueryTypeParams) {
    out = rewriteInterfaceTypeParams(
      out,
      spec.placeholders.query.RelationalQuery,
      spec.relationalQueryTypeParams
    )
  }

  out = rewriteSelectBuilderTypeParams(out, spec)
  out = rewriteSelectQueryBuilderBaseArgs(out, spec)

  return rewriteDialectNamePlaceholder(out, spec)
}

function rewriteInterfaceTypeParams(
  source: string,
  interfaceName: string,
  typeParams: string[]
) {
  return source.replace(
    new RegExp(
      `\\binterface ${escapeRegExp(interfaceName)}<[\\s\\S]*?^\\s*>`,
      'gm'
    ),
    `interface ${interfaceName}<\n    ${typeParams.join(',\n    ')},\n  >`
  )
}

function rewriteSelectBuilderTypeParams(source: string, spec: DialectSpec) {
  const name = spec.placeholders.core.SelectBuilder
  return source.replace(
    new RegExp(`\\binterface ${escapeRegExp(name)}<[\\s\\S]*?^\\s*>`, 'gm'),
    (match, offset) => {
      const bodyStart = source.slice(
        offset + match.length,
        offset + match.length + 500
      )
      const typeParams =
        bodyStart.includes('fromSingle()') ||
        bodyStart.includes('withoutFrom()')
          ? spec.selectBuilderFromTypeParams
          : spec.selectBuilderAsTypeParams
      return `interface ${name}<\n    ${typeParams.join(',\n    ')},\n  >`
    }
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rewriteDialectNamePlaceholder(source: string, spec: DialectSpec) {
  return source
    .replace(
      /const dialectName = '#dialect\/name' as 'pg' \| 'mysql' \| 'sqlite'\n\n?/g,
      ''
    )
    .replace(/\bdialectName\b/g, `'${spec.name}'`)
    .replace(/'#dialect\/name'/g, `'${spec.name}'`)
}

function rewriteSelectQueryBuilderBaseArgs(source: string, spec: DialectSpec) {
  const trailingArgs = spec.selectQueryBuilderBaseTrailingArgs.length
    ? `,\n          ${spec.selectQueryBuilderBaseTrailingArgs.join(',\n          ')}`
    : ''

  return source.replace(
    /SelectQueryBuilderBase<\n\s*SelectQueryBuilderHKT,\n\s*undefined,\n\s*TSelection,\n\s*'partial',\n\s*TResultType,\n\s*TRunResult,\n\s*TPreparedQueryHKT\n\s*>/g,
    `SelectQueryBuilderBase<\n          SelectQueryBuilderHKT,\n          undefined,\n          ${spec.selectQueryBuilderBaseArgs.join(',\n          ')}${trailingArgs}\n        >`
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

function rewriteDialectPublicTypeNames(source: string, spec: DialectSpec) {
  return source
    .replace(/\bRelationalSubquery\b/g, `${spec.pgPrefix}RelationalSubquery`)
    .replace(/\bUpsertSelectQuery\b/g, `${spec.pgPrefix}UpsertSelectQuery`)
    .replace(
      /\bSelectBuilderPrivate\b/g,
      `${spec.pgPrefix}SelectBuilderPrivate`
    )
    .replace(/\bSelectWithoutFrom\b/g, `${spec.pgPrefix}SelectWithoutFrom`)
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

function rewriteDialectConstants(source: string, spec: DialectSpec) {
  return source
    .replace(/\bDIALECT\b/g, `'${spec.name}'`)
    .replace(/'\w+' (!==|===) '\w+'/g, expr => String(eval(expr)))
}

function rewriteAdapterImports(source: string, spec: DialectSpec) {
  return source.replace(
    /from ['"]\.\/adapters\/(?:pg|#dialect)['"]/g,
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
