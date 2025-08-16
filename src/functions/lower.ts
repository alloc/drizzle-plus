import { SQL, sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

type LowercaseOrNull<T extends string | null> = T extends string
  ? Lowercase<T>
  : null

/**
 * Converts a string to lowercase.
 */
export function lower<T extends SQLExpression<string | null>>(
  value: T
): SQL<LowercaseOrNull<SQLResult<T>>> {
  return sql`lower(${value})`
}
