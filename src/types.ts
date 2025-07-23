import type {
  AnyColumn,
  Column,
  OrderByOperators,
  Placeholder,
  QueryPromise,
  QueryWithTypings,
  RelationsFieldFilter,
  SQL,
  SQLOperator,
  SQLWrapper,
  Table,
  ValueOrArray,
  View,
} from 'drizzle-orm'
import { CasingCache } from 'drizzle-orm/casing'
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

type UndefinedToNull<T> = T extends undefined ? null : T

export type QueryToResult<
  T extends AnyQuery,
  TOptions extends { unwrap: true } = never,
> = (
  T extends QueryPromise<infer TResult>
    ? TResult
    : SelectResultFields<Extract<T, AnySelectQuery>['_']['selectedFields']>
) extends infer TResult
  ? UndefinedToNull<
      TOptions extends { unwrap: true }
        ? TResult extends readonly (infer TElement)[]
          ? TElement extends object
            ? TElement[keyof TElement]
            : TElement
          : TResult extends object
            ? TResult[keyof TResult]
            : TResult
        : TResult
    >
  : never

export type QueryToSQL<
  T extends AnyQuery,
  TOptions extends { unwrap: true } = never,
> = QueryToResult<T, TOptions> extends infer TResult ? SQL<TResult> : never

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

/**
 * Infer the type for the `where` filter of a relational query.
 *
 * @example
 * ```ts
 * type FooFilter = InferRelationsFilter<typeof db.query.foo>
 * //   ^? type RelationsFilter<TFields, TSchema>
 *
 * const where: FooFilter = {
 *   bar: { gt: 0 },
 *   baz: { in: [1, 2, 3] },
 * }
 * ```
 */
export type InferRelationsFilter<T extends { findMany(args?: any): any }> =
  InferFindManyArgs<T>['where'] extends infer TWhere
    ? Extract<TWhere, object>
    : never

/**
 * Infer the type for the `with` clause of a relational query.
 *
 * @example
 * ```ts
 * type FooRelations = InferRelations<typeof db.query.foo>
 * //   ^? type { bar: { columns?, with?, … } }
 * ```
 */
export type InferRelations<T extends { findMany(args?: any): any }> =
  InferFindManyArgs<T>['with'] extends infer TWith
    ? Extract<TWith, object>
    : never

/**
 * Infer the type for the `orderBy` clause of a relational query.
 *
 * @example
 * ```ts
 * type FooOrderBy = InferOrderBy<typeof db.query.foo>
 * //   ^? type { id?: 'asc' | 'desc' | undefined, name?: 'asc' | 'desc' | undefined }
 * ```
 */
export type InferOrderBy<T extends { findMany(args?: any): any }> =
  InferFindManyArgs<T>['orderBy'] extends infer TOrderBy
    ? Extract<TOrderBy, object>
    : never

/**
 * Infer the query arguments for a `db.query#findMany` call.
 *
 * @example
 * ```ts
 * type FooFindManyArgs = InferFindManyArgs<typeof db.query.foo>
 * //   ^? type { columns, where, orderBy, … }
 * ```
 */
export type InferFindManyArgs<T extends { findMany(args?: any): any }> =
  T extends { findMany(args?: infer TArgs): any }
    ? Extract<TArgs, object>
    : never

/**
 * Infer the query arguments for a `db.query#findFirst` call.
 *
 * @example
 * ```ts
 * type FooFindFirstArgs = InferFindFirstArgs<typeof db.query.foo>
 * //   ^? type { columns, where, orderBy, … }
 * ```
 */
export type InferFindFirstArgs<T extends { findFirst(args?: any): any }> =
  T extends { findFirst(args?: infer TArgs): any } ? TArgs : never

/**
 * Coerce a `db.select()` result or a record of SQL expressions to a JSON object
 * query result.
 */
export type ToJsonObject<T extends AnySelectQuery | Record<string, unknown>> =
  T extends AnySelectQuery ? QueryToSQL<T> : SQL<SelectResultFields<T>>

export type AnyDialect = {
  casing: CasingCache
  sqlToQuery(sql: SQL): QueryWithTypings
}

/**
 * Represents the `returning` clause of an `insert`, `update`, or `delete`
 * query.
 */
export type ReturningClause<TTable extends Table> = Partial<
  Record<keyof TTable['_']['columns'] | (string & {}), boolean | SQL | Column>
>

type OneOrMany<TMode extends 'one' | 'many', T> = TMode extends 'one' ? T : T[]

/**
 * Infer the result fields of a `returning` clause.
 */
export type ReturningResultFields<
  TMode extends 'one' | 'many',
  TTable extends Table,
  TReturning extends ReturningClause<TTable>,
> = keyof TReturning extends never
  ? undefined
  : OneOrMany<
      TMode,
      ReturningClause<TTable> extends TReturning
        ? SelectResultFields<TTable['_']['columns']>
        : AllFalseValues<TReturning> extends TReturning
          ? SelectResultFields<Omit<TTable['_']['columns'], keyof TReturning>>
          : SelectResultFields<TReturning>
    >

type AllFalseValues<T extends object> = {
  [K in keyof T]-?: false
}

export type ExtractTable<
  T extends { table: any },
  TTable extends Table = Table,
> = Extract<T['table'], TTable>

/**
 * Represents the `orderBy` clause of a given table.
 *
 * Similar to `OrderBy` from the `drizzle-orm` package, but more type-safe.
 */
export type OrderByClause<TTable extends Table> =
  | {
      [K in keyof TTable['_']['columns']]?: 'asc' | 'desc' | undefined
    }
  | ((
      table: TTable,
      operators: OrderByOperators
    ) => ValueOrArray<AnyColumn | SQL>)
