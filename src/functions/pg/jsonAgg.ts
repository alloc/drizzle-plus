import { SQL, sql } from 'drizzle-orm'
import type { SQLExpression } from 'drizzle-plus/types'
import { createJsonArrayDecoder, getDecoder } from 'drizzle-plus/utils'

/**
 * Create a `json_agg()` expression from a given value.
 */
export function jsonAgg<T>(
  value: SQLExpression<T>
): SQL<Exclude<T, null>[] | null> {
  return sql`json_agg(${value})`.mapWith(
    createJsonArrayDecoder(getDecoder(value))
  )
}
