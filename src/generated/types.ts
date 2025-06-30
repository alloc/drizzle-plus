import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'

export type { RelationalQueryBuilder }

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
