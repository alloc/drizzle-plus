import type { AnyColumn, QueryPromise, SQL } from 'drizzle-orm'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export type SQLValue<T = unknown> =
  | SQL<T>
  | SQL.Aliased<T>
  | AnyColumn<{ data: T; driverParam: any }>

export type AnyQuery = AnySelectQuery | QueryPromise<any>

export interface AnySelectQuery {
  _: {
    selectedFields: Record<string, unknown>
    alias?: string
  }
  getSQL(): SQL
}

export type QueryToSQL<
  T extends AnyQuery,
  Options extends { toArray?: boolean; unwrap?: boolean } = {},
> = (
  T extends QueryPromise<infer TResult>
    ? TResult
    : SelectResultFields<Extract<T, AnySelectQuery>['_']['selectedFields']>
) extends infer TResult
  ? Options['unwrap'] extends true
    ? Options['toArray'] extends true
      ? SQL<TResult[keyof TResult][]>
      : SQL<TResult[keyof TResult]>
    : Options['toArray'] extends true
      ? SQL<TResult[]>
      : SQL<TResult>
  : never
