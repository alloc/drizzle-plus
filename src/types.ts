import type {
  AnyColumn,
  DBQueryConfig,
  QueryPromise,
  RelationsFilter,
  SQL,
} from 'drizzle-orm'
import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export type { RelationalQueryBuilder }

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

/**
 * Infer the type for the `where` filter of a relational query.
 */
export type InferWhereFilter<T extends RelationalQueryBuilder<any, any>> =
  T extends RelationalQueryBuilder<infer TSchema, infer TFields>
    ? RelationsFilter<TFields, TSchema>
    : never

export type InferFindManyArgs<T extends RelationalQueryBuilder<any, any>> =
  T extends RelationalQueryBuilder<infer TSchema, infer TFields>
    ? DBQueryConfig<'many', TSchema, TFields>
    : never

export type InferFindFirstArgs<T extends RelationalQueryBuilder<any, any>> =
  T extends RelationalQueryBuilder<infer TSchema, infer TFields>
    ? DBQueryConfig<'one', TSchema, TFields>
    : never
