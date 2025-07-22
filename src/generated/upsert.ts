import {
  getTableColumns,
  Query,
  QueryPromise,
  RelationsFilter,
  relationsFilterToSQL,
  Table,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import {
  PgInsertBuilder,
  PgInsertSelectQueryBuilder,
  PgInsertValue,
  QueryBuilder,
} from 'drizzle-orm/pg-core'
import {
  PgRelationalQuery,
  RelationalQueryBuilder,
} from 'drizzle-orm/pg-core/query-builders/query'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import {
  ExtractTable,
  ReturningClause,
  ReturningResultFields,
} from 'drizzle-plus/types'
import {
  getDefinedColumns,
  getSelectedFields,
  getSQL,
} from 'drizzle-plus/utils'
import { isFunction, select } from 'radashi'
import * as adapter from './adapters/pg'
import {
  excluded,
  getContext,
  getReturningFields,
  getTargetColumns,
} from './internal'

/**
 * Represents a `select` query that will have its result set used as the values
 * of an `upsert` query.
 */
export type PgUpsertSelectQuery<TTable extends Table> =
  | ((qb: QueryBuilder) => PgInsertSelectQueryBuilder<TTable>)
  | PgInsertSelectQueryBuilder<TTable>
  | adapter.RelationalQuery<
      PgInsertValue<TTable> | PgInsertValue<TTable>[] | undefined
    >

export interface DBUpsertConfig<
  TMode extends 'one' | 'many',
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
  TWhere,
> {
  /**
   * One or more rows to insert/update. This can also be a `SELECT` query or a
   * function that returns one.
   */
  data: TMode extends 'one'
    ? PgInsertValue<TTable>
    : readonly PgInsertValue<TTable>[] | PgUpsertSelectQuery<TTable>
  /**
   * This option enables you to partially override `data` with values that are
   * only used when the row already exists.
   */
  update?:
    | PgInsertValue<TTable>
    | ((table: TTable['_']['columns']) => PgInsertValue<TTable>)
    | undefined
  /**
   * Specify a filter to only update rows that match the filter.
   */
  where?: TWhere | undefined
  /**
   * Specify which columns to return. An empty object means “return nothing”.
   *
   * If left undefined, the query returns all columns of the updated row.
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
    upsert<TReturning extends ReturningClause<ExtractTable<TFields>>>(
      config: DBUpsertConfig<
        'one',
        ExtractTable<TFields>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpsertQueryPromise<'one', ExtractTable<TFields>, TReturning>

    upsert<TReturning extends ReturningClause<ExtractTable<TFields>>>(
      config: DBUpsertConfig<
        'many',
        ExtractTable<TFields>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpsertQueryPromise<'many', ExtractTable<TFields>, TReturning>
  }
}

RelationalQueryBuilder.prototype.upsert = function (config: {
  data: any
  update?: any
  where?: RelationsFilter<any, any>
  returning?: any
}): UpsertQueryPromise<any, any, any> {
  const { table, dialect, session } = getContext(this)
  const columns = getTableColumns(table)

  const qb = new PgInsertBuilder(table, session, dialect)

  let query: adapter.InsertQuery
  let selection: Record<string, unknown> | undefined

  if (isFunction(config.data) || config.data instanceof TypedQueryBuilder) {
    query = qb.select(config.data)
    selection = getSelectedFields((query as any).config.select)
  } else if (config.data instanceof PgRelationalQuery) {
    query = qb.select(getSQL(config.data))
    selection = getSelectedFields(config.data)
  } else {
    query = qb.values(config.data)
  }

  // Columns that *might* be used as a "conflict target" must be defined in the
  // very first object of `data`.
  const targetCandidates = getDefinedColumns(columns, [
    selection || (Array.isArray(config.data) ? config.data[0] : config.data),
  ])

  const target = getTargetColumns(table, Object.values(targetCandidates))
  if (!target) {
    throw new Error('No matching primary key or unique constraint found')
  }

  // Values to use instead of the ones in `data` if the row already exists.
  const update = isFunction(config.update)
    ? config.update(table)
    : config.update

  // Any column that is defined in at least one object of `data` needs to be
  // included in the `set` clause (unless it's a conflict target).
  const setCandidates = Array.isArray(config.data)
    ? getDefinedColumns(columns, config.data)
    : targetCandidates

  // Filter out values that don't need to be updated.
  const updatedEntries = select(Object.keys(setCandidates), key => {
    const value = update?.[key]
    if (value !== undefined) {
      return [key, value]
    }
    const column = columns[key]
    if (target.includes(column)) {
      return null
    }
    const name = dialect.casing.getColumnCasing(column)
    return [key, excluded(name)]
  })

  const returning = config.returning
    ? getReturningFields(config.returning, columns)
    : columns

  // If a returning clause is defined, ensure a column is updated so that the
  // result set isn't empty on conflict.
  if (returning && updatedEntries.length === 0) {
    const name = dialect.casing.getColumnCasing(target[0])
    updatedEntries.push([target[0].name, excluded(name)])
  }

  if (updatedEntries.length > 0) {
    query.onConflictDoUpdate({
      target,
      set: Object.fromEntries(updatedEntries),
      setWhere: config.where && relationsFilterToSQL(table, config.where),
    })
  } else {
    query.onConflictDoNothing()
  }

  if (returning) {
    query.returning(returning)
  }

  return new UpsertQueryPromise(
    query,
    !selection && !Array.isArray(config.data)
  )
}

export type UpsertQueryResult<
  TMode extends 'one' | 'many',
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
> = ReturningResultFields<TMode, TTable, TReturning>

export class UpsertQueryPromise<
  TMode extends 'one' | 'many',
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
> extends QueryPromise<UpsertQueryResult<TMode, TTable, TReturning>> {
  constructor(
    private query: QueryPromise<any>,
    private first: boolean
  ) {
    super()
  }
  override execute(): Promise<UpsertQueryResult<TMode, TTable, TReturning>> {
    return this.first ? this.query.then(results => results[0]) : this.query
  }
  toSQL(): Query {
    return (this.query as any).toSQL()
  }
}
