import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Converts a string to uppercase.
 *
 * @param value - The string to convert to uppercase.
 * @returns The uppercase string.
 */
export function upper<T extends string | null>(
  value: SQLExpression<T>
): SQL<Uppercase<Exclude<T, null>> | Extract<T, null>> {
  return sql`upper(${value})`
}
