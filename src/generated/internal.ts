import {
  RelationsFilter,
  relationsFilterToSQL,
  Table,
  TableRelationalConfig,
  TablesRelationalConfig,
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

const getTableConfigMemoized = memoByFirstArgument((table: Table) => {
  const { primaryKeys, uniqueConstraints } = getTableConfig(table)
  return { primaryKeys, uniqueConstraints }
})

export function getTargetColumns(table: Table, columns: PgColumn[]) {
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
