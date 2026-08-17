import {
  is,
  OrderBy,
  relationsOrderToSQL,
  SQL,
  Subquery,
  Table,
} from 'drizzle-orm'
import type {
  AnyMySqlDelete,
  MySqlInsertBase,
  AnyMySqlUpdate,
} from 'drizzle-orm/mysql-core'
import {
  MySqlAsyncInsertBase,
  MySqlInsertBuilder,
} from 'drizzle-orm/mysql-core'
import {
  MySqlRelationalQuery,
  MySqlRelationalQueryHKTBase,
} from 'drizzle-orm/mysql-core/query-builders/query'

export type RelationalQuery<TResult> = MySqlRelationalQuery<
  MySqlRelationalQueryHKTBase,
  TResult
>

export type InsertQuery = MySqlInsertBase<any, any, any>

export function createInsertBuilder(
  table: Table,
  session: any,
  dialect: any,
  withList?: Subquery[]
) {
  return new MySqlInsertBuilder(
    table as any,
    session,
    dialect,
    MySqlAsyncInsertBase as any
  )
}

export function limitUpdateOrDelete(
  table: Table,
  query: AnyMySqlUpdate | AnyMySqlDelete,
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
