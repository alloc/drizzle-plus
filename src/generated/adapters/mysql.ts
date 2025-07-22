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
  MySqlInsertBase,
  MySqlTable,
  MySqlUpdateBase,
  PreparedQueryHKTBase,
} from 'drizzle-orm/mysql-core'
import { MySqlRelationalQuery } from 'drizzle-orm/mysql-core/query-builders/query'

export type RelationalQuery<TResult> = MySqlRelationalQuery<
  PreparedQueryHKTBase,
  TResult
>

export type InsertQuery = MySqlInsertBase<any, any, any>

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
export declare function setReturningClauseForUpdateOrDelete(...args: any): void
