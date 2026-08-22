import {
  Column,
  is,
  OrderBy,
  relationsOrderToSQL,
  SQL,
  type Query,
  Subquery,
  Table,
} from 'drizzle-orm'
import type {
  AnySQLiteDeleteBase,
  SQLiteInsertBase,
  AnySQLiteUpdate,
} from 'drizzle-orm/sqlite-core'
import {
  SQLiteAsyncInsertBase,
  SQLiteInsertBuilder,
} from 'drizzle-orm/sqlite-core'
import {
  SQLiteRelationalQuery,
  SQLiteRelationalQueryHKTBase,
} from 'drizzle-orm/sqlite-core/query-builders/query'
import { getReturningFields } from '../../generated/sqlite/internal'

export type RelationalQuery<TResult> = SQLiteRelationalQuery<
  SQLiteRelationalQueryHKTBase,
  TResult
>

export type InsertQuery = SQLiteInsertBase<any, any, any>

export function createInsertBuilder(
  table: Table,
  session: any,
  dialect: any,
  withList?: Subquery[]
) {
  return new SQLiteInsertBuilder(
    table as any,
    session,
    dialect,
    withList,
    SQLiteAsyncInsertBase as any
  )
}

export function limitUpdateOrDelete(
  table: Table,
  query: AnySQLiteUpdate | AnySQLiteDeleteBase,
  limit?: number,
  orderBy?: OrderBy | SQL
): any {
  if (limit !== undefined) {
    query.limit(limit)
  }
  if (orderBy && !is(orderBy, SQL)) {
    orderBy = relationsOrderToSQL(table, orderBy)
  }
  if (orderBy) {
    query.orderBy(orderBy)
  }
}

export function setReturningClauseForUpdateOrDelete(
  query: { returning(fields: any): any },
  returningOption:
    | Record<string, unknown>
    | ((columns: Record<string, Column>) => Record<string, unknown>)
    | undefined,
  columns: Record<string, Column>
) {
  const returning =
    returningOption && getReturningFields(returningOption, columns)
  if (returning) {
    query.returning(returning)
  }
}

// Not needed by SQLite.
export declare function selectRowsToUpdateOrDelete(...args: any): Subquery[]
export declare function innerJoinMatchedRows(...args: any): void

export function executeSelect(
  session: any,
  query: Query,
  mapper: any,
  metadata: any,
  placeholderValues?: Record<string, unknown>
) {
  return session
    .prepareQuery(query, 'arrays', false, 'all', mapper, metadata)
    .execute(placeholderValues)
}
