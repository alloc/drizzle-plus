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
  SQLiteSession,
  SQLiteUpdateBase,
} from 'drizzle-orm/sqlite-core'
import { isFunction } from 'radashi'
import { getReturningFields } from '../sqlite/internal'

export function execute<T>(session: SQLiteSession<any, any>, query: SQL): T {
  return session.all(query)
}

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
  const returning = returningOption
    ? isFunction(returningOption)
      ? returningOption(columns)
      : returningOption
    : undefined

  // Undefined and {} are both ignored.
  if (returning && Object.keys(returning).length > 0) {
    query.returning(getReturningFields(returning, columns))
  }
}

// Not needed by SQLite.
export declare function selectRowsToUpdateOrDelete(...args: any): Subquery[]
export declare function innerJoinMatchedRows(...args: any): void
