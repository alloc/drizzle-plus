import {
  getTableColumns,
  RelationsFilter,
  relationsFilterToSQL,
  SQL,
  sql,
  Table,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { PgColumn, PgInsertBuilder, PgInsertValue } from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import {
  SelectResultField,
  SelectResultFields,
} from 'drizzle-orm/query-builders/select.types'
import { isFunction, mapValues, select } from 'radashi'
import { getContext, getTargetColumns } from './internal'

type ReturningClause<TTable extends Table> = Partial<
  Record<
    keyof TTable['_']['columns'] | (string & {}),
    boolean | SQL | ((table: TTable) => SQL)
  >
>

interface UpsertOptions<
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
  returning?: TReturning | undefined
}

interface UpsertQueryPromise<T> extends PromiseLike<T> {
  toSQL: () => { sql: string; params: any[] }
}

type InferTable<TFields extends TableRelationalConfig> = Extract<
  TFields['table'],
  Table
>

type InferUpsertResult<
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
> = keyof TReturning extends never
  ? undefined
  : ReturningClause<TTable> extends TReturning
    ? SelectResultFields<TTable['_']['columns']>
    : {
        [K in keyof TReturning]: TReturning[K] extends infer TValue
          ? SelectResultField<
              TValue extends true
                ? K extends keyof TTable['_']['columns']
                  ? TTable['_']['columns'][K]
                  : never
                : TValue
            >
          : never
      }

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    upsert<TReturning extends ReturningClause<InferTable<TFields>>>(
      options: UpsertOptions<
        'one',
        InferTable<TFields>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpsertQueryPromise<InferUpsertResult<InferTable<TFields>, TReturning>>

    upsert<TReturning extends ReturningClause<InferTable<TFields>>>(
      options: UpsertOptions<
        'many',
        InferTable<TFields>,
        TReturning,
        RelationsFilter<TFields, TSchema>
      >
    ): UpsertQueryPromise<InferUpsertResult<InferTable<TFields>, TReturning>[]>
  }
}

RelationalQueryBuilder.prototype.upsert = function (
  options: UpsertOptions<any, any, any, any>
): UpsertQueryPromise<any> {
  const { table, dialect, session } = getContext(this)
  const columns = getTableColumns(table)

  // Columns that *might* be used as a "conflict target" must be defined in the
  // very first object of `data`.
  const targetCandidates = getDefinedColumns(columns, [
    Array.isArray(options.data) ? options.data[0] : options.data,
  ])

  const target = getTargetColumns(table, Object.values(targetCandidates))
  if (!target) {
    throw new Error('No matching primary key or unique constraint found')
  }

  const query = new PgInsertBuilder(table, session, dialect).values(
    options.data
  )

  // Values to use instead of the ones in `data` if the row already exists.
  const update = isFunction(options.update)
    ? options.update(table)
    : options.update

  // Any column that is defined in at least one object of `data` needs to be
  // included in the `set` clause (unless it's a conflict target).
  const setCandidates = Array.isArray(options.data)
    ? getDefinedColumns(columns, options.data)
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
      setWhere: options.where && relationsFilterToSQL(table, options.where),
    })
  } else {
    query.onConflictDoNothing()
  }

  if (!options.returning || Object.keys(options.returning).length > 0) {
    query.returning(
      options.returning &&
        mapValues(options.returning, (value, key) =>
          value === true
            ? columns[key as string]
            : isFunction(value)
              ? value(table)
              : value
        )
    )
  }

  return {
    then(onfulfilled, onrejected): any {
      if (Array.isArray(options.data)) {
        return query.then(onfulfilled, onrejected)
      }
      return query
        .then((results: any) => results[0])
        .then(onfulfilled, onrejected)
    },
    toSQL: () => query.toSQL(),
  }
}

function getDefinedColumns(columns: Record<string, PgColumn>, data: any[]) {
  const usedColumns: Record<string, PgColumn> = {}
  for (const key of Object.keys(columns)) {
    for (const object of data) {
      if (Object.hasOwn(object, key) && object[key] !== undefined) {
        usedColumns[key] = columns[key]
        break
      }
    }
  }
  return usedColumns
}
