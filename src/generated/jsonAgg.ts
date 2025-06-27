import { noopDecoder, SQL, sql } from 'drizzle-orm'
import type { SQLValue } from 'drizzle-plus/types'
import { getDecoder } from 'drizzle-plus/utils'

/**
 * Create a `json_agg()` expression from a given value.
 */
export function jsonAgg<T>(value: SQLValue<T>) {
  return sql`json_agg(${value})`.mapWith(jsonString => {
    const decoder = getDecoder(value)
    const data: any[] = JSON.parse(jsonString)
    return decoder !== noopDecoder
      ? data.map(item => decoder.mapFromDriverValue(item))
      : data
  }) as SQL<T[]>
}
