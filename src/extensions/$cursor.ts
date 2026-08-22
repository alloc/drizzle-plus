import {
  RelationFieldsFilterInternals,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { RelationalQueryBuilder } from '#dialect/query'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import type { InferOrderBy } from 'drizzle-plus/types'
import type { InferColumns } from './types'

export type InferCursor<T extends RelationalQueryBuilder<any, any, any>> =
  Partial<SelectResultFields<InferColumns<T>>>

type CursorFieldFilters<TCursor extends object> = {
  [K in keyof TCursor]?: RelationFieldsFilterInternals<
    Exclude<TCursor[K], undefined>
  >
}

/**
 * The return type of the `$cursor` method.
 *
 * For multiple order-by columns, `where` contains lexicographic `OR`/`AND`
 * branches so each later column is compared only after preceding columns tie.
 *
 * @see https://github.com/alloc/drizzle-plus
 */
export interface RelationalQueryCursor<
  TOrderBy extends object,
  TCursor extends object | null | undefined,
  TWhere = TCursor extends object ? CursorFieldFilters<TCursor> : undefined,
> {
  where: TWhere
  orderBy: TOrderBy
}

declare module '#dialect/query' {
  export interface RelationalQueryBuilder<
    TQueryContext = unknown,
    TSchema extends TablesRelationalConfig = TablesRelationalConfig,
    TFields extends TableRelationalConfig = TableRelationalConfig,
  > {
    $cursor<
      TOrderBy extends Exclude<InferOrderBy<this>, Function>,
      TCursor extends
        | Partial<Record<keyof TOrderBy, unknown>>
        | null
        | undefined,
    >(
      orderBy: TOrderBy,
      cursor: TCursor
    ): RelationalQueryCursor<
      TOrderBy,
      TCursor,
      TCursor extends object ? RelationsFilter<TFields, TSchema> : undefined
    >
  }
}

RelationalQueryBuilder.prototype.$cursor = function (
  orderBy: any,
  cursor: any
): RelationalQueryCursor<any, any, any> {
  if (!cursor) {
    return { where: undefined, orderBy }
  }

  const columns = Object.keys(orderBy).filter(key => orderBy[key] !== undefined)
  const where: Record<string, unknown> = {}

  if (columns.length === 1) {
    const [column] = columns
    const comparator = orderBy[column] === 'asc' ? 'gt' : 'lt'
    where[column] = {
      [comparator]: cursor[column] !== undefined ? cursor[column] : null,
    }
  } else if (columns.length > 1) {
    where.OR = columns.map((column, index) => {
      const comparator = orderBy[column] === 'asc' ? 'gt' : 'lt'
      const current = {
        [column]: {
          [comparator]: cursor[column] !== undefined ? cursor[column] : null,
        },
      }

      if (index === 0) {
        return current
      }

      return {
        AND: [
          ...columns.slice(0, index).map(previous => ({
            [previous]:
              cursor[previous] !== undefined ? cursor[previous] : null,
          })),
          current,
        ],
      }
    })
  }

  return { where, orderBy }
}
