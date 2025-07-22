import {
  Column,
  is,
  OrderBy,
  relationsOrderToSQL,
  SQL,
  Subquery,
  Table,
} from 'drizzle-orm'
import {
  SQLiteDeleteBase,
  SQLiteInsertBase,
  SQLiteUpdateBase,
} from 'drizzle-orm/sqlite-core'
import { SQLiteRelationalQuery } from 'drizzle-orm/sqlite-core/query-builders/query'
import { getReturningFields } from '../sqlite/internal'

export type RelationalQuery<TResult> = SQLiteRelationalQuery<
  'sync' | 'async',
  TResult
>

export type InsertQuery = SQLiteInsertBase<any, any, any>

export function limitUpdateOrDelete(
  table: Table,
  query:
    | SQLiteUpdateBase<Table>
    | SQLiteDeleteBase<Table, 'sync' | 'async', any>,
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
  const returning = getReturningFields(returningOption, columns)
  if (returning) {
    query.returning(returning)
  }
}

// Not needed by SQLite.
export declare function selectRowsToUpdateOrDelete(...args: any): Subquery[]
export declare function innerJoinMatchedRows(...args: any): void
