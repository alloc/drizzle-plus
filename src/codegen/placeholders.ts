import type { DialectSpec } from './registry'

export function applyDialectPlaceholders(source: string, spec: DialectSpec) {
  let out = source

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

function removeDialectMarkerLines(source: string, spec: DialectSpec) {
  return source
    .replace(/( *)\/\/ (\w+)-insert: (.*?)\n/g, (_, space, dialect, code) =>
      dialect === spec.name ? `${space}${code}\n` : ''
    )
    .replace(/ *\/\/ (\w+)-remove-next-line\n([^\n]*\n)/g, (_, dialect, line) =>
      dialect === spec.name ? '' : line
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
