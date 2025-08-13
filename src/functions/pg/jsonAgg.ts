import { SQL, sql } from 'drizzle-orm'
import { coalesce } from 'drizzle-plus'
import type { SQLExpression } from 'drizzle-plus/types'
import { createJsonArrayDecoder, getDecoder } from 'drizzle-plus/utils'

export type JsonAggOptions = {
  orderBy?: SQLExpression
}

/**
 * Create a `json_agg()` expression from a given value.
 */
export function jsonAgg<T>(
  value: SQLExpression<T>,
  options?: JsonAggOptions
): SQL<Exclude<T, null>[] | null> {
  return sql`json_agg(${value}${options?.orderBy && sql` order by ${options.orderBy}`})`.mapWith(
    createJsonArrayDecoder(getDecoder(value))
  )
}

/**
 * Create a `json_agg()` expression that returns an empty array if the result
 * set is empty, rather than `null`.
 */
export function jsonAggNotNull<T>(
  value: SQLExpression<T>,
  options?: JsonAggOptions
): SQL<Exclude<T, null>[]> {
  return coalesce(jsonAgg(value, options), sql`'[]'::json`)
}
