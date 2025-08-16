import { SQL, sql } from 'drizzle-orm'
import type { SQLExpression, SQLResult } from 'drizzle-plus/types'
import { createJsonArrayDecoder, getDecoder } from 'drizzle-plus/utils'

/**
 * Create a `json_group_array()` expression from a given value.
 */
export function jsonGroupArray<T extends SQLExpression>(
  value: T
): SQL<SQLResult<T>[]> {
  return sql`json_group_array(${value})`.mapWith(
    createJsonArrayDecoder(getDecoder(value))
  )
}
