import fs from 'node:fs'

const pascalMap = {
  sqlite: 'SQLite',
  mysql: 'MySql',
}

const rqbTypeParams = {
  sqlite: `TMode extends 'sync' | 'async'`,
  mysql: `TPreparedQueryHKT extends import('drizzle-orm/mysql-core').PreparedQueryHKTBase`,
}

const sessionTypeParams = {
  sqlite: `<any, any>`,
  mysql: '',
}

const rootDir = 'src/dialect'

for (const name of fs.readdirSync(rootDir)) {
  const content = fs.readFileSync(`${rootDir}/${name}`, 'utf-8')

  for (const dialect of ['pg', 'mysql', 'sqlite']) {
    fs.mkdirSync(`src/${dialect}`, { recursive: true })
    fs.writeFileSync(
      `src/${dialect}/${name}`,
      dialect === 'pg'
        ? content
        : content
            .replace(/: PgSession/g, '$&' + sessionTypeParams[dialect])
            .replace(/\bpg-/g, dialect + '-')
            .replace(/\bPg/g, pascalMap[dialect])
            .replace(
              /\bRelationalQueryBuilder<(\s*)/gm,
              '$&' + rqbTypeParams[dialect] + ',$1'
            )
    )
  }
}
