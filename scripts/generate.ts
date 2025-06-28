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
  mysql: ['upsert'],
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
    const sessionTypeParams = {
      sqlite: `<any, any>`,
      mysql: '',
    }

    return content
      .replace(/: PgSession/g, '$&' + sessionTypeParams[dialect])
      .replace(
        snipRegex,
        applySnips(dialect, {
          sqlite: {
            then: dedent /* ts */ `
              then(onfulfilled, onrejected): any {
                return Promise.resolve(session.run(query))
                  .then(results => Number(results.rows[0]['count(*)']))
                  .then(onfulfilled, onrejected)
              },
            `,
          },
        })
      )
  },
  findManyAndCount(content, dialect) {
    const sessionTypeParams = {
      sqlite: `<any, any>`,
      mysql: '',
    }

    return content
      .replace(/: PgSession/g, '$&' + sessionTypeParams[dialect])
      .replace(
        snipRegex,
        applySnips(dialect, {
          sqlite: {
            then: dedent /* ts */ `
              then(onfulfilled, onrejected): any {
                // Execute both the findMany query and count query in parallel
                const findManyPromise = originalThis.findMany(config)
                const countPromise = Promise.resolve(session.run(countQuery))
                  .then(results => Number(results.rows[0]['count(*)']))

                return Promise.all([findManyPromise, countPromise])
                  .then(([data, count]) => ({ data, count }))
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

// Clear generated files from previous runs.
if (!process.argv.includes('--no-remove')) {
  for (const dir of globSync('src/generated/*', { onlyDirectories: true })) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
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
        .replace(/\bPg/g, pascalMap[dialect])
        // Update type parameters of common types.
        .replace(
          /\binterface RelationalQueryBuilder<(\s*)/gm,
          '$&' + rqbExtraTypeParams[dialect].code + ',$1'
        )
        .replace(
          /\bextends RelationalQueryBuilder<(\s*)/gm,
          '$&' + '$1any, '.repeat(rqbExtraTypeParams[dialect].count) + '$1'
        )
    }

    fs.mkdirSync(`src/generated/${dialect}`, { recursive: true })
    fs.writeFileSync(`src/generated/${dialect}/${name}.ts`, content)
  }
}
