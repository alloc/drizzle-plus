export const dialects = ['pg', 'mysql', 'sqlite'] as const

export type Dialect = (typeof dialects)[number]

export type DialectSpec = {
  name: Dialect
  coreModule: string
  dbModule: string
  queryModule: string
  functionsModule: string
  databaseType: string
  pgPrefix: string
  databaseTypeParams: string[]
  relationalQueryBuilderTypeParams: string[]
  relationalQueryTypeParams?: string[]
  relationalQueryBuilderExtendsArgs: string[]
  sessionSuffix: string
  capabilities: {
    create: boolean
    upsert: boolean
    materializedCte: boolean
    returning: boolean
    nativeUpdateDeleteLimit: boolean
  }
}

export const registry: Record<Dialect, DialectSpec> = {
  pg: {
    name: 'pg',
    coreModule: 'drizzle-orm/pg-core',
    dbModule: 'drizzle-orm/pg-core/db',
    queryModule: 'drizzle-orm/pg-core/query-builders/query',
    functionsModule: 'drizzle-plus/pg',
    databaseType: 'PgDatabase',
    pgPrefix: 'Pg',
    databaseTypeParams: [
      "TQueryResult extends import('drizzle-orm/pg-core').PgQueryResultHKT",
      'TFullSchema extends Record<string, unknown>',
      'TRelations extends AnyRelations',
      'TTablesConfig extends TablesRelationalConfig',
      'TSchema extends V1.TablesRelationalConfig',
    ],
    relationalQueryBuilderTypeParams: [
      'TSchema extends TablesRelationalConfig',
      'TFields extends TableRelationalConfig',
    ],
    relationalQueryTypeParams: [
      'THKT extends PgRelationalQueryHKTBase',
      'TResult',
    ],
    relationalQueryBuilderExtendsArgs: [],
    sessionSuffix: '',
    capabilities: {
      create: true,
      upsert: true,
      materializedCte: true,
      returning: true,
      nativeUpdateDeleteLimit: false,
    },
  },
  mysql: {
    name: 'mysql',
    coreModule: 'drizzle-orm/mysql-core',
    dbModule: 'drizzle-orm/mysql-core/db',
    queryModule: 'drizzle-orm/mysql-core/query-builders/query',
    functionsModule: 'drizzle-plus/mysql',
    databaseType: 'MySqlDatabase',
    pgPrefix: 'MySql',
    databaseTypeParams: [
      'TPreparedQueryHKT extends PreparedQueryHKTBase',
      'TFullSchema extends Record<string, unknown>',
      'TRelations extends AnyRelations',
      'TTablesConfig extends TablesRelationalConfig',
      'TSchema extends V1.TablesRelationalConfig',
    ],
    relationalQueryBuilderTypeParams: [
      "TPreparedQueryHKT extends import('drizzle-orm/mysql-core').PreparedQueryHKTBase",
      'TSchema extends TablesRelationalConfig',
      'TFields extends TableRelationalConfig',
    ],
    relationalQueryBuilderExtendsArgs: ['any'],
    sessionSuffix: '',
    capabilities: {
      create: false,
      upsert: false,
      materializedCte: false,
      returning: false,
      nativeUpdateDeleteLimit: true,
    },
  },
  sqlite: {
    name: 'sqlite',
    coreModule: 'drizzle-orm/sqlite-core',
    dbModule: 'drizzle-orm/sqlite-core/db',
    queryModule: 'drizzle-orm/sqlite-core/query-builders/query',
    functionsModule: 'drizzle-plus/sqlite',
    databaseType: 'BaseSQLiteDatabase',
    pgPrefix: 'SQLite',
    databaseTypeParams: [
      "TResultKind extends 'sync' | 'async'",
      'TRunResult',
      'TFullSchema extends Record<string, unknown>',
      'TRelations extends AnyRelations',
      'TTablesConfig extends TablesRelationalConfig',
      'TSchema extends V1.TablesRelationalConfig',
    ],
    relationalQueryBuilderTypeParams: [
      "TMode extends 'sync' | 'async'",
      'TSchema extends TablesRelationalConfig',
      'TFields extends TableRelationalConfig',
    ],
    relationalQueryTypeParams: ["TType extends 'sync' | 'async'", 'TResult'],
    relationalQueryBuilderExtendsArgs: ['any'],
    sessionSuffix: '',
    capabilities: {
      create: false,
      upsert: true,
      materializedCte: false,
      returning: true,
      nativeUpdateDeleteLimit: true,
    },
  },
}
