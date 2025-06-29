import {
  KnownKeysOnly,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import { InferColumns, InferOrderBy } from './types'

export type InferCursor<T extends RelationalQueryBuilder<any, any>> = Partial<
  SelectResultFields<InferColumns<T>>
>

/**
 * The return type of the `$cursor` method.
 *
 * @see https://github.com/alloc/drizzle-plus
 */
export interface RelationalQueryCursor<
  TOrderBy extends object,
  TCursor extends object | null | undefined,
  TSchema extends TablesRelationalConfig,
  TFields extends TableRelationalConfig,
> {
  where: TCursor extends object
    ? KnownKeysOnly<RelationsFilter<TFields, TSchema>, TCursor>
    : TCursor extends null | undefined
      ? undefined
      : never
  orderBy: TOrderBy
}

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    $cursor<
      TOrderBy extends InferOrderBy<this>,
      TCursor extends
        | KnownKeysOnly<InferCursor<this>, TOrderBy>
        | null
        | undefined,
    >(
      orderBy: TOrderBy,
      cursor: TCursor
    ): RelationalQueryCursor<TOrderBy, TCursor, TSchema, TFields>
  }
}

RelationalQueryBuilder.prototype.$cursor = function (
  orderBy: Record<string, 'asc' | 'desc' | undefined>,
  cursor: object | null | undefined
): RelationalQueryCursor<any, any, any, any> {
  if (!cursor) {
    return { where: undefined, orderBy }
  }

  const where: Record<string, Record<string, any>> = {}
  Object.keys(orderBy)
    .filter(key => orderBy[key] !== undefined)
    .forEach((column, index, columns) => {
      const value = (cursor as any)[column]
      const comparator =
        index < columns.length - 1
          ? orderBy[column] === 'asc'
            ? 'gte'
            : 'lte'
          : orderBy[column] === 'asc'
            ? 'gt'
            : 'lt'

      where[column] = {
        [comparator]: value !== undefined ? value : null,
      }
    })

  return { where, orderBy }
}
