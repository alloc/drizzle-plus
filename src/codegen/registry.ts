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
  placeholders: DialectPlaceholders
  extraTypeImports: string[]
  databaseTypeParams: string[]
  relationalQueryBuilderTypeParams: string[]
  relationalQueryTypeParams?: string[]
  selectBuilderAsTypeParams: string[]
  selectBuilderFromTypeParams: string[]
  selectQueryBuilderBaseArgs: string[]
  selectQueryBuilderBaseTrailingArgs: string[]
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

export type DialectPlaceholders = {
  core: Record<string, string>
  db: Record<string, string>
  query: Record<string, string>
  functions: Record<string, string>
}

function placeholders(
  prefix: string,
  databaseType: string
): DialectPlaceholders {
  return {
    core: {
      Column: `${prefix}Column`,
      Database: databaseType,
      Dialect: `${prefix}Dialect`,
      getTableConfig: 'getTableConfig',
      InsertBase: `${prefix}InsertBase`,
      InsertBuilder: `${prefix}InsertBuilder`,
      InsertConfig: `${prefix}InsertConfig`,
      InsertSelectQueryBuilder: `${prefix}InsertSelectQueryBuilder`,
      InsertValue: `${prefix}InsertValue`,
      QueryBuilder: 'QueryBuilder',
      SelectBase: `${prefix}SelectBase`,
      SelectBuilder: `${prefix}SelectBuilder`,
      SelectConfig: `${prefix}SelectConfig`,
      SelectHKTBase: `${prefix}SelectHKTBase`,
      SelectQueryBuilderBase: `${prefix}SelectQueryBuilderBase`,
      SelectQueryBuilderHKT: `${prefix}SelectQueryBuilderHKT`,
      Session: `${prefix}Session`,
      SetOperatorWithResult: `${prefix}SetOperatorWithResult`,
      Table: `${prefix}Table`,
      TableConfig: 'TableConfig',
      UpdateBase: `${prefix}UpdateBase`,
      UpdateSetSource: `${prefix}UpdateSetSource`,
      SelectedFields: 'SelectedFields',
      SelectedFieldsOrdered: 'SelectedFieldsOrdered',
      WithBuilder: 'WithBuilder',
      WithSubqueryWithSelection: 'WithSubqueryWithSelection',
    },
    db: {
      Database: databaseType,
    },
    query: {
      RelationalQuery: `${prefix}RelationalQuery`,
      RelationalQueryBuilder: 'RelationalQueryBuilder',
      RelationalQueryHKTBase: `${prefix}RelationalQueryHKTBase`,
    },
    functions: {
      SQLType: 'SQLType',
    },
  }
}

export const registry: Record<Dialect, DialectSpec> = {
  pg: {
    name: 'pg',
    coreModule: 'drizzle-orm/pg-core',
    dbModule: 'drizzle-orm/pg-core/async/db',
    queryModule: 'drizzle-orm/pg-core/query-builders/query',
    functionsModule: 'drizzle-plus/pg',
    databaseType: 'PgAsyncDatabase',
    pgPrefix: 'Pg',
    placeholders: placeholders('Pg', 'PgAsyncDatabase'),
    extraTypeImports: [],
    databaseTypeParams: [
      "TQueryResult extends import('drizzle-orm/pg-core').PgQueryResultHKT",
      'TRelations extends AnyRelations',
    ],
    relationalQueryBuilderTypeParams: [
      'TSchema extends TablesRelationalConfig',
      'TFields extends TableRelationalConfig',
      'TBuilderHKT extends PgRelationalQueryHKTBase',
    ],
    relationalQueryTypeParams: [
      'THKT extends PgRelationalQueryHKTBase',
      'TResult',
    ],
    selectBuilderAsTypeParams: [
      'TSelection extends SelectedFields | undefined',
      'THKT extends SelectHKTBase',
    ],
    selectBuilderFromTypeParams: [
      'TSelection extends SelectedFields | undefined',
      "TBuilderMode extends 'db' | 'qb'",
    ],
    selectQueryBuilderBaseArgs: ['TSelection', "'partial'"],
    selectQueryBuilderBaseTrailingArgs: [],
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
    dbModule: 'drizzle-orm/mysql-core/async/db',
    queryModule: 'drizzle-orm/mysql-core/query-builders/query',
    functionsModule: 'drizzle-plus/mysql',
    databaseType: 'MySqlAsyncDatabase',
    pgPrefix: 'MySql',
    placeholders: placeholders('MySql', 'MySqlAsyncDatabase'),
    extraTypeImports: [],
    databaseTypeParams: [
      "TQueryResult extends import('drizzle-orm/mysql-core').MySqlQueryResultHKT",
      'TRelations extends AnyRelations',
    ],
    relationalQueryBuilderTypeParams: [
      'TSchema extends TablesRelationalConfig',
      'TFields extends TableRelationalConfig',
      'TBuilderHKT extends MySqlRelationalQueryHKTBase',
    ],
    relationalQueryTypeParams: [
      'THKT extends MySqlRelationalQueryHKTBase',
      'TResult',
    ],
    selectBuilderAsTypeParams: [
      'TSelection extends SelectedFields | undefined',
      'THKT extends SelectHKTBase',
      "TPreparedQueryHKT extends import('drizzle-orm/mysql-core').MySqlPreparedQueryHKT",
    ],
    selectBuilderFromTypeParams: [
      'TSelection extends SelectedFields | undefined',
      "TPreparedQueryHKT extends import('drizzle-orm/mysql-core').MySqlPreparedQueryHKT",
      "TBuilderMode extends 'db' | 'qb'",
    ],
    selectQueryBuilderBaseArgs: ['TSelection', "'partial'"],
    selectQueryBuilderBaseTrailingArgs: ['TPreparedQueryHKT'],
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
    dbModule: 'drizzle-orm/sqlite-core/async/db',
    queryModule: 'drizzle-orm/sqlite-core/query-builders/query',
    functionsModule: 'drizzle-plus/sqlite',
    databaseType: 'SQLiteAsyncDatabase',
    pgPrefix: 'SQLite',
    placeholders: placeholders('SQLite', 'SQLiteAsyncDatabase'),
    extraTypeImports: [],
    databaseTypeParams: [
      "TResultKind extends 'sync' | 'async'",
      'TRunResult',
      'TRelations extends AnyRelations',
    ],
    relationalQueryBuilderTypeParams: [
      "TMode extends 'sync' | 'async'",
      'TSchema extends TablesRelationalConfig',
      'TFields extends TableRelationalConfig',
      'TBuilderHKT extends SQLiteRelationalQueryHKTBase',
    ],
    relationalQueryTypeParams: [
      'THKT extends SQLiteRelationalQueryHKTBase',
      'TResult',
    ],
    selectBuilderAsTypeParams: [
      'TSelection extends SelectedFields | undefined',
      'THKT extends SelectHKTBase',
      "TResultType extends 'sync' | 'async'",
      'TRunResult',
    ],
    selectBuilderFromTypeParams: [
      'TSelection extends SelectedFields | undefined',
      "TResultType extends 'sync' | 'async'",
      'TRunResult',
      "TBuilderMode extends 'db' | 'qb'",
    ],
    selectQueryBuilderBaseArgs: [
      'TResultType',
      'TRunResult',
      'TSelection',
      "'partial'",
    ],
    selectQueryBuilderBaseTrailingArgs: [],
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
