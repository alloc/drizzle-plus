import { SQL, sql } from 'drizzle-orm'
import { coalesce } from 'drizzle-plus'
import type { SQLExpression, SQLResult } from 'drizzle-plus/types'
import { createJsonArrayDecoder, getDecoder } from 'drizzle-plus/utils'

export type JsonAggOptions = {
  orderBy?: SQLExpression
}

/**
 * Create a `json_agg()` expression from a given value.
 */
export function jsonAgg<T extends SQLExpression>(
  value: T,
  options?: JsonAggOptions
): SQL<SQLResult<T>[] | null> {
  return sql`jsonb_agg(${value}${options?.orderBy && sql` order by ${options.orderBy}`})`.mapWith(
    createJsonArrayDecoder(getDecoder(value))
  )
}

/**
 * Create a `json_agg()` expression that returns an empty array if the result
 * set is empty, rather than `null`.
 */
export function jsonAggNotNull<T extends SQLExpression>(
  value: T,
  options?: JsonAggOptions
): SQL<SQLResult<T>[]> {
  return coalesce(jsonAgg(value, options), sql<any>`'[]'::json`)
}
