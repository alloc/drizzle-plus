import {
  getTableColumns,
  SQL,
  sql,
  Table,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import {
  getTableConfig,
  PgColumn,
  PgInsertBuilder,
  PgInsertValue,
} from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import { SelectResultField } from 'drizzle-orm/query-builders/select.types'
import { castArray, isFunction, mapValues, select } from 'radashi'
import { getContext } from './internal'

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
> {
  data: TMode extends 'one'
    ? PgInsertValue<TTable>
    : readonly PgInsertValue<TTable>[]
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
  TReturning extends ReturningClause<any>,
> = {
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
      options: UpsertOptions<'one', InferTable<TFields>, TReturning>
    ): UpsertQueryPromise<InferUpsertResult<InferTable<TFields>, TReturning>>

    upsert<TReturning extends ReturningClause<InferTable<TFields>>>(
      options: UpsertOptions<'many', InferTable<TFields>, TReturning>
    ): UpsertQueryPromise<InferUpsertResult<InferTable<TFields>, TReturning>[]>
  }
}

RelationalQueryBuilder.prototype.upsert = function (
  options: UpsertOptions<any, any, any>
): UpsertQueryPromise<any> {
  const { table, dialect, session } = getContext(this)

  const usedKeys = new Set<string>()
  for (const item of castArray(options.data)) {
    for (const key in item) {
      if (item[key] !== undefined) {
        usedKeys.add(key)
      }
    }
  }

  const columns = getTableColumns(table)
  const usedColumns = Array.from(usedKeys, key => columns[key])

  const target = getTargetColumns(table, usedColumns)
  if (!target) {
    throw new Error('No matching primary key or unique constraint found')
  }

  const query = new PgInsertBuilder(table, session, dialect).values(
    options.data
  )

  const updatedEntries = select(Array.from(usedKeys), key => {
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

const getTableConfigMemoized = memoByFirstArgument((table: Table) => {
  const { primaryKeys, uniqueConstraints } = getTableConfig(table)
  return { primaryKeys, uniqueConstraints }
})

function getTargetColumns(table: Table, columns: PgColumn[]) {
  // If the primary key is defined, prefer it over any unique constraint.
  const uniqueColumn =
    columns.find(column => column.primary) ||
    columns.find(column => column.isUnique)
  if (uniqueColumn) {
    return [uniqueColumn]
  }

  // Find a composite column constraint that matches the columns.
  const { primaryKeys, uniqueConstraints } = getTableConfigMemoized(table)
  if (primaryKeys[0]) {
    // We can't just use `arrayEquals` here because the `columns` could be in a
    // different order.
    const target = select(primaryKeys[0].columns, column =>
      columns.includes(column) ? column : null
    )
    if (target.length === primaryKeys[0].columns.length) {
      return target
    }
  }
  for (const uniqueConstraint of uniqueConstraints) {
    // We can't just use `arrayEquals` here because the `columns` could be in a
    // different order.
    const target = select(uniqueConstraint.columns, column =>
      columns.includes(column) ? column : null
    )
    if (target.length === uniqueConstraint.columns.length) {
      return target
    }
  }
}

function memoByFirstArgument<TFunc extends (...args: any[]) => any>(
  func: TFunc
) {
  const cache = new Map<any, any>()
  return (...args: Parameters<TFunc>): ReturnType<TFunc> => {
    if (cache.has(args[0])) {
      return cache.get(args[0])
    }
    const result = func(...args)
    cache.set(args[0], result)
    return result
  }
}
