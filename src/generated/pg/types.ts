// @ts-nocheck
import { SQL, Subquery } from 'drizzle-orm'
import { PgColumn as Column } from 'drizzle-orm/pg-core'
import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import { RawFieldsToSelection } from 'drizzle-plus/types'

export type { RelationalQueryBuilder }

/**
 * Infer table columns from a `db.query` factory.
 *
 * @example
 * ```ts
 * type FooColumns = InferColumns<typeof db.query.foo>
 * //   ^? type { id: Column; name: Column }
 * ```
 */
type ColumnsOf<T> = T extends { columns: infer TColumns } ? TColumns : never

export type InferColumns<T extends RelationalQueryBuilder<any, any, any>> =
  T extends RelationalQueryBuilder<any, infer TMaybeFields, infer TFields>
    ? ColumnsOf<TMaybeFields> extends never
      ? ColumnsOf<TFields>
      : ColumnsOf<TMaybeFields>
    : never

type RawFieldsToColumnsSelection<T extends Record<string, unknown>> =
  RawFieldsToSelection<T> extends infer TSelection
    ? {
        [K in keyof TSelection]: TSelection[K] extends infer TExpression
          ?
              | TExpression
              | (TExpression extends SQL.Aliased<any> ? Column : never)
          : never
      }
    : never

export type RawFieldsToSubquery<
  T extends Record<string, unknown>,
  TAlias extends string = string,
> =
  RawFieldsToColumnsSelection<T> extends infer TSelection
    ? Subquery<TAlias, TSelection & Record<string, unknown>> & TSelection
    : never
