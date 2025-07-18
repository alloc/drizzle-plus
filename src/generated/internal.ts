import {
  Column,
  RelationsFilter,
  relationsFilterToSQL,
  sql,
  SQL,
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
} from 'drizzle-orm/pg-core'
import { select } from 'radashi'
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
  returning: any,
  columns: Record<string, Column>
) {
  const selectedFields: any = {}
  for (const key in returning) {
    switch (returning[key]) {
      case true:
        selectedFields[key] = columns[key as string]
      case false:
        break
      default:
        selectedFields[key] = returning[key]
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

let withSubqueryFlags:
  | WeakMap<
      WithSubquery,
      {
        materialized?: boolean
        recursive?: boolean
      }
    >
  | undefined

export function setWithSubqueryFlags(
  withSubquery: WithSubquery,
  flags: {
    materialized?: boolean
    recursive?: boolean
  }
) {
  if (!withSubqueryFlags) {
    withSubqueryFlags = new WeakMap()

    // @ts-expect-error: Rewrite internal method
    PgDialect.prototype.buildWithCTE = function (
      queries: Subquery[] | undefined
    ): SQL | undefined {
      if (!queries?.length) return undefined

      const result = sql.raw('with ')
      for (const [i, withSubquery] of queries.entries()) {
        const flags = withSubqueryFlags!.get(withSubquery)
        const { alias, sql: subquery } =
          withSubquery._ as typeof withSubquery._ & {
            materializeFlag?: boolean
            recursiveFlag?: boolean
          }
        result.append(sql`${sql.identifier(alias)} as `)
        if (flags) {
          if (flags.recursive) {
            result.append(sql.raw('recursive '))
          } else if (flags.materialized) {
            result.append(sql.raw('materialized '))
          } else if (flags.materialized === false) {
            result.append(sql.raw('not materialized '))
          }
        }
        result.append(sql`(${subquery})`)
        if (i < queries.length - 1) {
          result.append(sql.raw(', '))
        }
      }
      result.append(sql.raw(' '))
      return result
    }
  }

  withSubqueryFlags.set(withSubquery, flags)
}

export type InferDialect<TTable extends Table> =
  TTable['_']['config']['dialect']

export type ExcludeDialect<TTable extends Table, TDialect extends string, T> =
  InferDialect<TTable> extends TDialect ? never : T
