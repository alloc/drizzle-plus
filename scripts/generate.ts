import fs from 'node:fs'
import path from 'node:path'
import { dedent } from 'radashi'
import { globSync } from 'tinyglobby'

const dialects = ['pg', 'mysql', 'sqlite'] as const

type Dialect = (typeof dialects)[number]
type DialectExceptPg = Exclude<Dialect, 'pg'>

// These are used in type names.
const pascalMap: Record<DialectExceptPg, string> = {
  sqlite: 'SQLite',
  mysql: 'MySql',
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
    const rqbTypeParams = {
      sqlite: `TMode extends 'sync' | 'async'`,
      mysql: `TPreparedQueryHKT extends import('drizzle-orm/mysql-core').PreparedQueryHKTBase`,
    }

    const sessionTypeParams = {
      sqlite: `<any, any>`,
      mysql: '',
    }

    return content
      .replace(/: PgSession/g, '$&' + sessionTypeParams[dialect])
      .replace(
        /\bRelationalQueryBuilder<(\s*)/gm,
        '$&' + rqbTypeParams[dialect] + ',$1'
      )
      .replace(
        snipRegex,
        applySnips(dialect, {
          sqlite: {
            then: dedent /* ts */ `
              then(onfulfilled, onrejected): any {
                return Promise.resolve(session.run(query))
                  .then(results => Number(results[0].count))
                  .then(onfulfilled, onrejected)
              },
            `,
          },
        })
      )
  },
  jsonAgg(content, dialect) {
    return content
      .replace(
        /json_agg/g,
        {
          sqlite: 'json_group_array',
          mysql: 'json_arrayagg',
        }[dialect]
      )
      .replace(
        /jsonAgg/g,
        {
          sqlite: 'jsonGroupArray',
          mysql: 'jsonArrayAgg',
        }[dialect]
      )
  },
  toJsonObject(content, dialect) {
    return content.replace(
      /json_build_object/g,
      {
        sqlite: 'json_object',
        mysql: 'json_object',
      }[dialect]
    )
  },
}

for (const file of globSync('src/generated/*.ts')) {
  const template = fs.readFileSync(file, 'utf-8')
  const name = path.basename(file, '.ts')

  for (const dialect of dialects) {
    let content = template
    if (dialect !== 'pg') {
      const replacer = replacers[name]
      if (replacer) {
        content = replacer(content, dialect)
      }
      // Always update imports and type names.
      content = content
        .replace(/\bpg-/g, dialect + '-')
        .replace(/\bPg/g, pascalMap[dialect])
    }

    fs.mkdirSync(`src/generated/${dialect}`, { recursive: true })
    fs.writeFileSync(`src/generated/${dialect}/${name}.ts`, content)
  }
}
