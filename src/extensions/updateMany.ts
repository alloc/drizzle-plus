import {
  getColumns,
  Query,
  QueryPromise,
  RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { Table, UpdateBase, UpdateSetSource } from '#dialect/core'
import { RelationalQueryBuilder } from '#dialect/query'
import {
  AnyRelationsFilter,
  ExtractTable,
  OrderByClause,
  ReturningClause,
  ReturningResultFields,
} from 'drizzle-plus/types'
import { isFunction } from 'radashi'
import * as adapter from './adapters/#dialect'
import { ExcludeDialect, getContext, getFilterSQL } from './internal'

const dialectName = '#dialect/name' as 'pg' | 'mysql' | 'sqlite'

export interface DBUpdateManyConfig<
  TTable extends Table,
  TReturning extends ReturningClause<TTable> = ReturningClause<TTable>,
  TWhere = AnyRelationsFilter,
> {
  set:
    | UpdateSetSource<TTable>
    | ((table: TTable['_']['columns']) => UpdateSetSource<TTable>)
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

declare module '#dialect/query' {
  export interface RelationalQueryBuilder<
    TQueryContext = unknown,
    TSchema extends TablesRelationalConfig = TablesRelationalConfig,
    TFields extends TableRelationalConfig = TableRelationalConfig,
  > {
    updateMany<TReturning extends ReturningClause<ExtractTable<TFields>> = {}>(
      config: DBUpdateManyConfig<
        ExtractTable<TFields, Table>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpdateManyQueryPromise<ExtractTable<TFields, Table>, TReturning>
  }
}

RelationalQueryBuilder.prototype.updateMany = function (
  config: DBUpdateManyConfig<any, any, any>
): UpdateManyQueryPromise<any, any> {
  const { table, dialect, session } = getContext(this)
  const columns = getColumns(table)

  // Since Postgres doesn't support LIMIT in UPDATE queries, we need to use a
  // CTE that selects the rows to update.
  const withList =
    dialectName === 'pg' && config.limit !== undefined
      ? adapter.selectRowsToUpdateOrDelete(
          this,
          config.limit,
          config.where,
          config.orderBy
        )
      : undefined

  const query = new UpdateBase(
    table,
    isFunction(config.set) ? config.set(columns) : config.set,
    session,
    dialect,
    withList
  )

  if (dialectName === 'pg' && config.limit !== undefined) {
    adapter.innerJoinMatchedRows(table, query)
  } else if (config.where) {
    query.where(getFilterSQL(this, config.where))
  }

  if (dialectName !== 'pg' && config.limit !== undefined) {
    adapter.limitUpdateOrDelete(table, query, config.limit, config.orderBy)
  }

  if (dialectName !== 'mysql') {
    adapter.setReturningClauseForUpdateOrDelete(
      query,
      config.returning,
      columns
    )
  }

  return query as UpdateManyQueryPromise<any, any>
}

export type UpdateManyQueryResult<
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
> = keyof TReturning extends never
  ? number
  : ReturningResultFields<'many', TTable, TReturning>

export interface UpdateManyQueryPromise<
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
> extends QueryPromise<UpdateManyQueryResult<TTable, TReturning>> {
  toSQL(): Query
}
