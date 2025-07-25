import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'tinyglobby'

console.log('Generating...')

const dialects = ['pg', 'mysql', 'sqlite'] as const

type Dialect = (typeof dialects)[number]
type DialectExceptPg = Exclude<Dialect, 'pg'>

// These are used in type names.
const pascalMap: Record<DialectExceptPg, string> = {
  sqlite: 'SQLite',
  mysql: 'MySql',
}

const unsupportedFeatures: Partial<Record<DialectExceptPg, string[]>> = {
  mysql: ['create', 'upsert', '$withMaterialized'],
  sqlite: ['$withMaterialized'],
}

// RelationalQueryBuilder type parameters.
const typeParams = {
  sqlite: {
    Database: 'BaseSQLiteDatabase',
    RelationalQueryBuilder: {
      code: `TMode extends 'sync' | 'async'`,
      count: 1,
    },
    RelationalQuery: {
      code: `TType extends 'sync' | 'async'`,
    },
    Session: '<any, any>',
  },
  mysql: {
    Database: 'MySqlDatabase',
    RelationalQueryBuilder: {
      code: `TPreparedQueryHKT extends import('drizzle-orm/mysql-core').PreparedQueryHKTBase`,
      count: 1,
    },
    RelationalQuery: undefined,
    Session: '',
  },
} as const

for (const dialect of dialects) {
  const root = path.join('src/generated', dialect)

  // Clear generated files from previous runs.
  if (!process.argv.includes('--no-remove')) {
    fs.rmSync(root, {
      recursive: true,
      force: true,
    })
  }

  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      extends: '../tsconfig.json',
      include: ['./'],
    })
  )
}

// Note: This is intentionally not recursive.
for (const file of globSync('src/generated/*.ts')) {
  const template = fs.readFileSync(file, 'utf-8')
  const name = path.basename(file, '.ts')

  for (const dialect of dialects) {
    if (unsupportedFeatures[dialect]?.includes(name)) {
      continue
    }

    let content = template
      // Rewrite the adapter import.
      .replace(/\.\/(adapters\/)pg/g, '../$1' + dialect)
      // Replace the DIALECT constant.
      .replace(/\bDIALECT\b/g, `'${dialect}'`)
      // Evaluate comparisons of two string literals.
      .replace(/'\w+' (!==|===) '\w+'/g, expr => eval(expr))

    if (dialect !== 'pg') {
      content = content
        // Update import specifiers.
        .replace(/\bpg-/g, dialect + '-')
        .replace(/\/pg\b/g, '/' + dialect)

        // Update type names.
        .replace(/: PgSession/g, '$&' + typeParams[dialect].Session)
        .replace(/\bPgDatabase/g, typeParams[dialect].Database)
        .replace(/\bPg/g, pascalMap[dialect])

        // Update type parameters of common types.
        .replace(
          /\binterface RelationalQueryBuilder<(\s*)/gm,
          '$&' + typeParams[dialect].RelationalQueryBuilder.code + ',$1'
        )
        .replace(
          /\b(interface )?\w+RelationalQuery<(\s*)/gm,
          (match, iface, param) => {
            let { code }: { code: string } =
              (iface && typeParams[dialect].RelationalQuery) ||
              typeParams[dialect].RelationalQueryBuilder
            if (!iface) {
              code = code.replace(/ extends .+$/, '')
            }
            return match + code + ',' + param
          }
        )
        .replace(
          /\b(?:extends|:) RelationalQueryBuilder<(\s*)/gm,
          '$&' +
            '$1any, '.repeat(typeParams[dialect].RelationalQueryBuilder.count) +
            '$1'
        )

        // Uncomment dialect-specific code.
        .replace(/( *)\/\/ (\w+)-insert: (.*?)\n/g, (_, space, apply, code) =>
          apply === dialect ? space + code + '\n' : ''
        )
        .replace(
          / *\/\/ (\w+)-remove-next-line\n([^\n]*\n)/g,
          (_, apply, line) => (apply === dialect ? '' : line)
        )
    }

    fs.writeFileSync(path.join('src/generated', dialect, name + '.ts'), content)
  }
}

for (const dir of globSync('src/functions/*', { onlyDirectories: true })) {
  const dialect = path.basename(dir)
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.ts')) {
      continue
    }
    if (file === 'types.ts') {
      fs.appendFileSync(
        path.join('src/generated', dialect, 'types.ts'),
        '\n' + fs.readFileSync(path.join(dir, file), 'utf-8')
      )
    } else {
      fs.copyFileSync(
        path.join(dir, file),
        path.join('src/generated', dialect, file)
      )
    }
    fs.appendFileSync(
      path.join('src/generated', dialect, 'index.ts'),
      `export * from './${path.basename(file, '.ts')}'\n`
    )
  }
}
