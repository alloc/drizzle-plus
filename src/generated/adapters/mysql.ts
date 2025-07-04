import {
  is,
  OrderBy,
  relationsOrderToSQL,
  SQL,
  Subquery,
  Table,
} from 'drizzle-orm'
import {
  MySqlDeleteBase,
  MySqlSession,
  MySqlTable,
  MySqlUpdateBase,
} from 'drizzle-orm/mysql-core'

export function execute<T>(session: MySqlSession, query: SQL) {
  return session.execute<T>(query)
}

export function limitUpdateOrDelete(
  table: Table,
  query:
    | MySqlUpdateBase<MySqlTable, any, any>
    | MySqlDeleteBase<MySqlTable, any, any>,
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

// Not needed by MySQL.
export declare function selectRowsToUpdateOrDelete(...args: any): Subquery[]
export declare function innerJoinMatchedRows(...args: any): void
