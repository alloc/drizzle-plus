import { SQL, sql } from 'drizzle-orm'
import type { SQLExpression } from 'drizzle-plus/types'
import { createJsonArrayDecoder, getDecoder } from 'drizzle-plus/utils'

/**
 * Create a `json_arrayagg()` expression from a given value.
 */
export function jsonArrayAgg<T>(value: SQLExpression<T>): SQL<T[]> {
  return sql`json_arrayagg(${value})`.mapWith(
    createJsonArrayDecoder(getDecoder(value))
  )
}
