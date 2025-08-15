import {
  BuildRelationalQueryResult,
  Column,
  Name,
  RelationsFilter,
  relationsFilterToSQL,
  sql,
  SQL,
  SQLChunk,
  StringChunk,
  Subquery,
  Table,
  TableRelationalConfig,
  TablesRelationalConfig,
  WithSubquery,
} from 'drizzle-orm'
import { CasingCache } from 'drizzle-orm/casing'
import {
  getTableConfig,
  PgColumn,
  PgDialect,
  PgSession,
  PgTable,
  SelectedFields,
  WithBuilder,
} from 'drizzle-orm/pg-core'
import { SelectionProxyHandler } from 'drizzle-orm/selection-proxy'
import { DecodedFields } from 'drizzle-plus/types'
import { pushStringChunk } from 'drizzle-plus/utils'
import { isFunction, select } from 'radashi'
import { RelationalQuery } from './adapters/pg'
import { RelationalQueryBuilder } from './types'

export function getContext(rqb: RelationalQueryBuilder<any, any>) {
  return rqb as unknown as {
    tables: Record<string, PgTable>
    schema: TablesRelationalConfig
    tableNamesMap: Record<string, string>
    table: PgTable
    tableConfig: TableRelationalConfig
    dialect: PgDialect & { casing: CasingCache }
    session: PgSession
  }
}

export function getFilterSQL(
  rqb: RelationalQueryBuilder<any, any>,
  filter: RelationsFilter<any, any>
) {
  const ctx = getContext(rqb)
  return relationsFilterToSQL(
    ctx.table,
    filter,
    ctx.tableConfig.relations,
    ctx.schema,
    ctx.tableNamesMap,
    ctx.dialect.casing
  )
}

export function getReturningFields(
  returning:
    | Record<string, unknown>
    | ((columns: Record<string, Column>) => Record<string, unknown>),
  columns: Record<string, Column>
) {
  if (isFunction(returning)) {
    returning = returning(columns)

    // Fast path for "return all columns" case.
    if (returning === columns) {
      return returning
    }
  }

  // Ignore undefined values.
  const keys = Object.keys(returning).filter(
    key => returning[key] !== undefined
  )

  // Empty object means "return nothing".
  if (!keys.length) {
    return null
  }

  const selectedFields: any = {}

  // Check if at least one non-false value exists.
  if (keys.some(key => returning[key] !== false)) {
    for (const key of keys) {
      if (returning[key] === false) {
        continue
      }
      selectedFields[key] =
        returning[key] === true ? columns[key] : returning[key]
    }
  } else {
    // If only false values exist, return all but the false columns.
    const omittedKeys = keys
    for (const key in columns) {
      if (!omittedKeys.includes(key)) {
        selectedFields[key] = columns[key]
      }
    }
    if (!Object.keys(selectedFields).length) {
      return null
    }
  }

  return selectedFields
}

const getTableConfigMemoized = memoByFirstArgument((table: PgTable) => {
  const { primaryKeys, uniqueConstraints } = getTableConfig(table)
  return { primaryKeys, uniqueConstraints }
})

export function getTargetColumns(table: PgTable, columns: PgColumn[]) {
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
    const target = select(primaryKeys[0].columns, targetColumn =>
      columns.find(column => column.name === targetColumn.name)
    )
    if (target.length === primaryKeys[0].columns.length) {
      return target
    }
  }
  for (const uniqueConstraint of uniqueConstraints) {
    const target = select(uniqueConstraint.columns, targetColumn =>
      columns.find(column => column.name === targetColumn.name)
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

type WithSubqueryAddons = {
  columns?: string[]
  materialized?: boolean
  recursive?: boolean
}

let withSubqueryAddons: WeakMap<WithSubquery, WithSubqueryAddons> | undefined

const getWithSubqueryAddons = (withSubquery: WithSubquery) =>
  withSubqueryAddons!.get(withSubquery) || {}

function buildWithCTE(queries: Subquery[] | undefined): SQL | undefined {
  if (!queries?.length) return

  const chunks: SQLChunk[] = [new StringChunk('with ')]

  if (getWithSubqueryAddons(queries[0]).recursive) {
    chunks.push(new StringChunk('recursive '))
  }

  for (let i = 0; i < queries.length; i++) {
    const { alias, sql: subquery } = queries[i]._

    chunks.push(new Name(alias))

    const addons = getWithSubqueryAddons(queries[i])
    if (addons.columns) {
      pushStringChunk(chunks, ' (')
      for (const column of addons.columns) {
        chunks.push(new Name(column))
        pushStringChunk(chunks, ', ')
      }
      pushStringChunk(chunks, ')')
    }

    pushStringChunk(chunks, ' as ')

    if (addons.materialized) {
      pushStringChunk(chunks, 'materialized ')
    } else if (addons.materialized === false) {
      pushStringChunk(chunks, 'not materialized ')
    }

    pushStringChunk(chunks, '(')
    chunks.push(subquery)
    pushStringChunk(chunks, ')')

    if (i < queries.length - 1) {
      pushStringChunk(chunks, ', ')
    }
  }

  pushStringChunk(chunks, ' ')

  return new SQL(chunks)
}

export function injectWithSubqueryAddons(
  withBuilder: ReturnType<WithBuilder>,
  addons: WithSubqueryAddons,
  transform?: (arg: any) => any
) {
  const originalMethod = withBuilder.as
  withBuilder.as = function (arg: any) {
    const withSubquery = originalMethod(transform ? transform(arg) : arg)
    return setWithSubqueryAddons(withSubquery, addons)
  }
  return withBuilder
}

export function setWithSubqueryAddons(
  withSubquery: WithSubquery,
  addons: WithSubqueryAddons
) {
  if (!withSubqueryAddons) {
    withSubqueryAddons = new WeakMap()

    // @ts-expect-error: Rewrite internal method
    PgDialect.prototype.buildWithCTE = buildWithCTE
  }

  withSubqueryAddons.set(withSubquery, addons)
  return withSubquery
}

export type InferDialect<TTable extends Table> =
  TTable['_']['config']['dialect']

export type ExcludeDialect<TTable extends Table, TDialect extends string, T> =
  InferDialect<TTable> extends TDialect ? never : T

export function excluded(name: string) {
  return sql`excluded.${sql.identifier(name)}`
}

export const sqlNull = sql`null`

// A workaround for https://github.com/drizzle-team/drizzle-orm/issues/3971
export function buildInsertSelect(
  selectedFields: any,
  columns: Record<string, PgColumn>,
  isRelationalQuery?: boolean
): SelectedFields {
  const values: any = {}
  for (const key in columns) {
    if (selectedFields[key] !== undefined) {
      values[key] = isRelationalQuery
        ? sql.identifier(key)
        : selectedFields[key]
    } else {
      const column = columns[key]
      if (column.hasDefault || column.generated || column.generatedIdentity) {
        throw new Error(
          `Column "${key}" cannot be undefined for an INSERT…SELECT query, because of a bug in Drizzle that always includes generated/optional columns in the column list: https://github.com/drizzle-team/drizzle-orm/issues/3971`
        )
      }
      // Set null even if column is non-nullable, because Drizzle includes
      // every possible column in the INSERT query's column list.
      values[key] = sqlNull
    }
  }
  return values
}

/**
 * Hooks into the private `_getQuery` method to retrieve the selection array
 * used to map the result rows.
 */
export function buildRelationalQuery(
  query: RelationalQuery<any>
): BuildRelationalQueryResult {
  return (query as any)._getQuery()
}

export function createWithSubquery(
  query: SQL,
  alias: string,
  decodedFields: DecodedFields
): Subquery {
  const selection: Record<string, SQL> = {}
  for (const name in decodedFields) {
    // The identifier must be fully-qualified to avoid ambiguity.
    selection[name] =
      sql`${sql.identifier(alias)}.${sql.identifier(name)}`.mapWith(
        decodedFields[name]
      )
  }

  // Adapted from https://github.com/drizzle-team/drizzle-orm/blob/109ccd34b549030e10dd9cd27e41641d0878a856/drizzle-orm/src/pg-core/db.ts#L175
  return new Proxy(
    new WithSubquery(query, selection, alias, true),
    new SelectionProxyHandler({
      alias,
      // All values of `selection` are SQL objects. This option allows accessing
      // the SQL object directly by its field name.
      sqlBehavior: 'sql',
    })
  )
}
