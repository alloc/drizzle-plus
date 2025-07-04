import {
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

// Not needed by SQLite.
export declare function selectRowsToUpdateOrDelete(...args: any): Subquery[]
export declare function innerJoinMatchedRows(...args: any): void
