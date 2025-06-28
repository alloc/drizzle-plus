import {
  RelationsFilter,
  relationsFilterToSQL,
  TableRelationalConfig,
  TablesRelationalConfig,
} from 'drizzle-orm'
import { CasingCache } from 'drizzle-orm/casing'
import { PgDialect, PgSession, PgTable } from 'drizzle-orm/pg-core'
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
