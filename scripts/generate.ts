import fs from 'node:fs'
import path from 'node:path'
import { dedent } from 'radashi'
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
  mysql: ['upsert', '$withMaterialized'],
  sqlite: ['$withMaterialized'],
}

// RelationalQueryBuilder type parameters.
const rqbExtraTypeParams = {
  sqlite: {
    code: `TMode extends 'sync' | 'async'`,
    count: 1,
  },
  mysql: {
    code: `TPreparedQueryHKT extends import('drizzle-orm/mysql-core').PreparedQueryHKTBase`,
    count: 1,
  },
}

// Database session type parameters.
const sessionTypeParams = {
  sqlite: `<any, any>`,
  mysql: '',
}

// See the `src/generated/count.ts` module for an example of how to use this.
const snipRegex = /([ ]*)\/\/ @start (\w+)\n([\S\s]+)\/\/ @end \2\n[ ]*/gm
const applySnips =
  (dialect: Dialect, snips: Partial<Record<Dialect, Record<string, string>>>) =>
  (_: any, space: string, key: string, original: string) => {
    const snip = snips[dialect]?.[key]
    return snip ? space + snip.replace(/(\n|$)/g, '\n' + space) : original
  }

// Each module in `src/generated` has its own replacer function.
const replacers: {
  [key: string]: (content: string, dialect: DialectExceptPg) => string
} = {
  count(content, dialect) {
    return content.replace(
      snipRegex,
      applySnips(dialect, {
        sqlite: {
          execute: dedent /* ts */ `
            const result = await this.session.get<any>(query)
          `,
        },
      })
    )
  },
}

// Clear generated files from previous runs.
if (!process.argv.includes('--no-remove')) {
  for (const dir of globSync('src/generated/*', { onlyDirectories: true })) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

for (const dialect of dialects) {
  const root = path.join('src/generated', dialect)
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      extends: '../tsconfig.json',
      include: ['./'],
    })
  )
}

for (const file of globSync('src/generated/*.ts')) {
  const template = fs.readFileSync(file, 'utf-8')
  const name = path.basename(file, '.ts')

  for (const dialect of dialects) {
    if (unsupportedFeatures[dialect]?.includes(name)) {
      continue
    }

    let content = template
    if (dialect !== 'pg') {
      const replacer = replacers[name]
      if (replacer) {
        content = replacer(content, dialect)
      }
      content = content
        // Update imports and type names.
        .replace(/\bpg-/g, dialect + '-')
        .replace(/: PgSession/g, '$&' + sessionTypeParams[dialect])
        .replace(/\bPg/g, pascalMap[dialect])
        // Update type parameters of common types.
        .replace(
          /\binterface RelationalQueryBuilder<(\s*)/gm,
          '$&' + rqbExtraTypeParams[dialect].code + ',$1'
        )
        .replace(
          /\b\w+RelationalQuery<(\s*)/gm,
          '$&' +
            rqbExtraTypeParams[dialect].code.replace(/ extends .+$/, '') +
            ',$1'
        )
        .replace(
          /\b(?:extends|:) RelationalQueryBuilder<(\s*)/gm,
          '$&' + '$1any, '.repeat(rqbExtraTypeParams[dialect].count) + '$1'
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
    fs.copyFileSync(
      path.join(dir, file),
      path.join('src/generated', dialect, file)
    )
    fs.appendFileSync(
      path.join('src/generated', dialect, 'index.ts'),
      `export * from './${path.basename(file, '.ts')}'\n`
    )
  }
}
