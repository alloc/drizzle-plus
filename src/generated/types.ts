import type { RelationsFilter } from 'drizzle-orm'
import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'

export type { RelationalQueryBuilder }

/**
 * Infer the type for the `where` filter of a relational query.
 *
 * @example
 * ```ts
 * type FooWhereFilter = InferWhereFilter<typeof db.query.foo>
 * //   ^? type RelationsFilter<TFields, TSchema>
 *
 * const where: FooWhereFilter = {
 *   bar: { gt: 0 },
 *   baz: { in: [1, 2, 3] },
 * }
 * ```
 */
export type InferWhereFilter<T extends RelationalQueryBuilder<any, any>> =
  T extends RelationalQueryBuilder<infer TSchema, infer TFields>
    ? RelationsFilter<TFields, TSchema>
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
export type InferOrderBy<T extends RelationalQueryBuilder<any, any>> =
  T extends RelationalQueryBuilder<any, infer TFields>
    ? { [K in keyof TFields['columns']]?: 'asc' | 'desc' | undefined }
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
  T extends { findMany(args?: infer TArgs): any } ? TArgs : never

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
 * Infer table columns from a `db.query` factory.
 *
 * @example
 * ```ts
 * type FooColumns = InferColumns<typeof db.query.foo>
 * //   ^? type { id: PgColumn; name: PgColumn }
 * ```
 */
export type InferColumns<T extends RelationalQueryBuilder<any, any>> =
  T extends RelationalQueryBuilder<any, infer TFields>
    ? TFields['columns']
    : never
