import type {
  OrderBy,
  RelationsFilter,
  SQL,
  Subquery,
  Table,
} from 'drizzle-orm'
import type { InsertQuery } from '../dialect/core'

export type RelationalQuery<TSelection = unknown, TResult = unknown> = {
  _: {
    selectedFields: TSelection
    result: TResult
  }
}

export type { InsertQuery }

export declare function createInsertBuilder(...args: any[]): any

export declare function selectRowsToUpdateOrDelete(
  rqb: unknown,
  limit: number,
  where?: RelationsFilter<any, any>,
  orderBy?: OrderBy | SQL
): Subquery[]

export declare function innerJoinMatchedRows(table: Table, query: unknown): void

export declare function limitUpdateOrDelete(
  table: Table,
  query: unknown,
  limit?: number,
  orderBy?: OrderBy | SQL
): void

export declare function setReturningClauseForUpdateOrDelete(
  query: { returning(fields: any): any },
  returningOption:
    | Record<string, unknown>
    | ((columns: Record<string, unknown>) => Record<string, unknown>)
    | undefined,
  columns: Record<string, unknown>
): void
