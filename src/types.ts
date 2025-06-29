import type {
  AnyColumn,
  OrderByOperators,
  Placeholder,
  QueryPromise,
  RelationsFieldFilter,
  SQL,
  SQLOperator,
  SQLWrapper,
  Table,
  ValueOrArray,
  View,
} from 'drizzle-orm'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export type SQLValue<T> = T | SQLExpression<T>

export type SQLExpression<T = unknown> =
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

export interface AnyRelationsFilter {
  [key: string]:
    | boolean
    | RelationsFieldFilter<unknown>
    | undefined
    // Nested relations / NOT operator
    | AnyRelationsFilter
    // AND/OR operators
    | AnyRelationsFilter[]
    // RAW operator
    | SQLWrapper
    | ((table: any, operators: any) => SQL)
}

/**
 * A bug-free version of `AnyDBQueryConfig` from the `drizzle-orm` module.
 */
export type AnyDBQueryConfig = {
  columns?: Record<string, boolean | undefined> | undefined
  where?: AnyRelationsFilter | undefined
  extras?:
    | Record<
        string,
        | SQLWrapper
        | ((table: Table | View, operators: SQLOperator) => SQLWrapper)
      >
    | undefined
  with?: Record<string, boolean | AnyDBQueryConfig | undefined> | undefined
  orderBy?:
    | Record<string, 'asc' | 'desc' | undefined>
    | ((
        table: Table | View,
        operators: OrderByOperators
      ) => ValueOrArray<AnyColumn | SQL>)
    | undefined
  offset?: number | Placeholder | undefined
  limit?: number | Placeholder | undefined
}
