import { ColumnBaseConfig, ColumnDataType, SQL, Subquery } from 'drizzle-orm'
import { PgColumn } from 'drizzle-orm/pg-core'
import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import { RawFieldsToSelection } from 'drizzle-plus/types'

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

type RawFieldsToColumnsSelection<T extends Record<string, unknown>> =
  RawFieldsToSelection<T> extends infer TSelection
    ? {
        [K in keyof TSelection]: TSelection[K] extends infer TExpression
          ?
              | TExpression
              | (TExpression extends SQL.Aliased<infer TData>
                  ? PgColumn<
                      ColumnBaseConfig<ColumnDataType, string> & {
                        data: Exclude<TData, null>
                        notNull: TData | null extends TData ? false : true
                      }
                    >
                  : never)
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
