import {
  getTableColumns,
  Query,
  QueryPromise,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import {
  PgInsertBase,
  PgInsertConfig,
  PgInsertValue,
  PgTable,
} from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import {
  ExtractTable,
  ReturningClause,
  ReturningResultFields,
} from 'drizzle-plus/types'
import { getContext, getReturningFields } from './internal'

export interface DBCreateConfig<
  TMode extends 'one' | 'many',
  TTable extends PgTable,
  TReturning extends ReturningClause<TTable>,
> {
  data: TMode extends 'one'
    ? PgInsertValue<TTable>
    : readonly PgInsertValue<TTable>[]
  /**
   * If true, inserted rows that conflict with an existing row will be ignored,
   * rather than cause an error.
   */
  skipDuplicates?: boolean
  /**
   * Specify which columns to return. An empty object means “return nothing”.
   *
   * If left undefined, the query returns the number of rows inserted.
   */
  returning?:
    | TReturning
    | ((table: TTable['_']['columns']) => TReturning)
    | undefined
}

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    create<TReturning extends ReturningClause<ExtractTable<TFields>> = {}>(
      config: DBCreateConfig<'one', ExtractTable<TFields>, TReturning>
    ): CreateQueryPromise<'one', ExtractTable<TFields>, TReturning>

    create<TReturning extends ReturningClause<ExtractTable<TFields>> = {}>(
      config: DBCreateConfig<'many', ExtractTable<TFields>, TReturning>
    ): CreateQueryPromise<'many', ExtractTable<TFields>, TReturning>
  }
}

RelationalQueryBuilder.prototype.create = function (
  config: DBCreateConfig<any, any, any>
): CreateQueryPromise<any, any, any> {
  const { table, dialect, session } = getContext(this)
  const columns = getTableColumns(table)

  const query = new PgInsertBase(
    table,
    config.data as PgInsertConfig['values'],
    session,
    dialect
  )

  if (config.skipDuplicates) {
    query.onConflictDoNothing()
  }

  const returning = getReturningFields(config.returning, columns)
  if (returning) {
    query.returning(returning)
  }

  return query as CreateQueryPromise<any, any, any>
}

export type CreateQueryResult<
  TMode extends 'one' | 'many',
  TTable extends PgTable,
  TReturning extends ReturningClause<TTable>,
> = keyof TReturning extends never
  ? number
  : ReturningResultFields<TMode, TTable, TReturning>

export interface CreateQueryPromise<
  TMode extends 'one' | 'many',
  TTable extends PgTable,
  TReturning extends ReturningClause<TTable>,
> extends QueryPromise<CreateQueryResult<TMode, TTable, TReturning>> {
  toSQL(): Query
}
