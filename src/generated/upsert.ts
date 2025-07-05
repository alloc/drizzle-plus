import {
  getTableColumns,
  RelationsFilter,
  relationsFilterToSQL,
  sql,
  Table,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { PgInsertBuilder, PgInsertValue } from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import {
  ExtractTable,
  ReturningClause,
  ReturningResultFields,
} from 'drizzle-plus/types'
import { getDefinedColumns } from 'drizzle-plus/utils'
import { isFunction, select } from 'radashi'
import { getContext, getReturningFields, getTargetColumns } from './internal'

export interface DBUpsertConfig<
  TMode extends 'one' | 'many',
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
  TWhere,
> {
  data: TMode extends 'one'
    ? PgInsertValue<TTable>
    : readonly PgInsertValue<TTable>[]
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

interface UpsertQueryPromise<T> extends PromiseLike<T> {
  toSQL: () => { sql: string; params: any[] }
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
    ): UpsertQueryPromise<
      ReturningResultFields<'one', ExtractTable<TFields>, TReturning>
    >

    upsert<TReturning extends ReturningClause<ExtractTable<TFields>>>(
      config: DBUpsertConfig<
        'many',
        ExtractTable<TFields>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpsertQueryPromise<
      ReturningResultFields<'many', ExtractTable<TFields>, TReturning>
    >
  }
}

RelationalQueryBuilder.prototype.upsert = function (config: {
  data: any
  update?: any
  where?: RelationsFilter<any, any>
  returning?: any
}): UpsertQueryPromise<any> {
  const { table, dialect, session } = getContext(this)
  const columns = getTableColumns(table)

  // Columns that *might* be used as a "conflict target" must be defined in the
  // very first object of `data`.
  const targetCandidates = getDefinedColumns(columns, [
    Array.isArray(config.data) ? config.data[0] : config.data,
  ])

  const target = getTargetColumns(table, Object.values(targetCandidates))
  if (!target) {
    throw new Error('No matching primary key or unique constraint found')
  }

  const query = new PgInsertBuilder(table, session, dialect).values(config.data)

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
    return [key, sql`excluded.${sql.identifier(name)}`]
  })

  if (updatedEntries.length > 0) {
    query.onConflictDoUpdate({
      target,
      set: Object.fromEntries(updatedEntries),
      setWhere: config.where && relationsFilterToSQL(table, config.where),
    })
  } else {
    query.onConflictDoNothing()
  }

  const returning = config.returning
    ? isFunction(config.returning)
      ? config.returning(columns)
      : config.returning
    : undefined

  if (!returning || Object.keys(returning).length > 0) {
    query.returning(returning && getReturningFields(returning, columns))
  }

  return {
    then(onfulfilled, onrejected): any {
      if (Array.isArray(config.data)) {
        return query.then(onfulfilled, onrejected)
      }
      return query
        .then((results: any) => results[0])
        .then(onfulfilled, onrejected)
    },
    toSQL: () => query.toSQL(),
  }
}
