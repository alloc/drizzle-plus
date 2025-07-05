import {
  getTableColumns,
  RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { PgInsertValue, PgTable, PgUpdateBase } from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import {
  AnyRelationsFilter,
  ExtractTable,
  OrderByClause,
  ReturningClause,
  ReturningResultFields,
} from 'drizzle-plus/types'
import { isFunction } from 'radashi'
import * as adapter from './adapters/pg'
import { ExcludeDialect, getContext, getFilterSQL } from './internal'

export interface DBUpdateManyConfig<
  TTable extends PgTable,
  TReturning extends ReturningClause<TTable> = ReturningClause<TTable>,
  TWhere = AnyRelationsFilter,
> {
  set:
    | PgInsertValue<TTable>
    | ((table: TTable['_']['columns']) => PgInsertValue<TTable>)
  /**
   * Specify a filter to only update rows that match the filter.
   */
  where?: TWhere
  /**
   * Specify the order of the rows to update. If undefined, the rows are updated
   * in an arbitrary order.
   */
  orderBy?: OrderByClause<TTable>
  /**
   * Specify the maximum number of rows to update.
   */
  limit?: number
  /**
   * Specify which columns to return. An empty object means “return nothing”.
   *
   * If left undefined, the query returns the number of rows updated.
   */
  returning?: ExcludeDialect<
    TTable,
    'mysql',
    TReturning | ((table: TTable['_']['columns']) => TReturning) | undefined
  >
}

interface UpdateManyQueryPromise<T> extends PromiseLike<T> {
  toSQL: () => { sql: string; params: any[] }
}

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    updateMany<TReturning extends ReturningClause<ExtractTable<TFields>> = {}>(
      config: DBUpdateManyConfig<
        ExtractTable<TFields, PgTable>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpdateManyQueryPromise<
      keyof TReturning extends never
        ? number
        : ReturningResultFields<'many', ExtractTable<TFields>, TReturning>
    >
  }
}

RelationalQueryBuilder.prototype.updateMany = function (
  config: DBUpdateManyConfig<any, any, any>
): UpdateManyQueryPromise<any> {
  const { table, dialect, session } = getContext(this)
  const columns = getTableColumns(table)

  // Since Postgres doesn't support LIMIT in UPDATE queries, we need to use a
  // CTE that selects the rows to update.
  const withList =
    DIALECT === 'pg' && config.limit !== undefined
      ? adapter.selectRowsToUpdateOrDelete(
          this,
          config.limit,
          config.where,
          config.orderBy
        )
      : undefined

  const query = new PgUpdateBase(
    table,
    isFunction(config.set) ? config.set(columns) : config.set,
    session,
    dialect,
    withList
  )

  if (DIALECT === 'pg' && config.limit !== undefined) {
    adapter.innerJoinMatchedRows(table, query)
  } else if (config.where) {
    query.where(getFilterSQL(this, config.where))
  }

  if (DIALECT !== 'pg' && config.limit !== undefined) {
    adapter.limitUpdateOrDelete(table, query, config.limit, config.orderBy)
  }

  if (DIALECT !== 'mysql') {
    adapter.setReturningClauseForUpdateOrDelete(
      query,
      config.returning,
      columns
    )
  }

  return {
    then(onfulfilled, onrejected): any {
      return query.then(onfulfilled, onrejected)
    },
    toSQL: () => query.toSQL(),
  }
}
