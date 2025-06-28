import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Converts a string to lowercase.
 *
 * @param value - The string to convert to lowercase.
 * @returns The lowercase string.
 */
export function lower<T extends string | null>(
  value: SQLExpression<T>
): SQL<Lowercase<Exclude<T, null>> | Extract<T, null>> {
  return sql`lower(${value})`
}
